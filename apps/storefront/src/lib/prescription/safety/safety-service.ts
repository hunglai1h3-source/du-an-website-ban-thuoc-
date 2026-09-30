import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/prescription/errors";
import {
  SafetyContext,
  SafetyReportData,
  SafetyFindingData,
  MedicationContextItem,
} from "./safety-types";
import {
  ExtractionNotReadyError,
  SafetyAlreadyProcessingError,
  SafetyReportNotFoundError,
} from "./safety-errors";
import { SafetyEngine, defaultSafetyEngine } from "./safety-engine";
import { LocalDrugRepository } from "../extraction/drug-repository";

/**
 * H4CARE Pharmacy - Safety Service Orchestrator
 * Phase 5: Deterministic Safety Engine
 */

export class SafetyService {
  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly engine: SafetyEngine = defaultSafetyEngine,
    private readonly drugRepo: LocalDrugRepository = new LocalDrugRepository()
  ) {}

  /**
   * Chạy quy trình kiểm tra an toàn toàn diện cho đơn thuốc
   */
  public async runSafetyCheck(
    prescriptionId: string,
    options?: {
      forceRerun?: boolean;
      allergyProfile?: string[] | null;
    }
  ): Promise<SafetyReportData> {
    const startTime = Date.now();

    if (!prescriptionId || typeof prescriptionId !== "string") {
      throw new ValidationError("Mã định danh đơn thuốc không hợp lệ.", 400, "INVALID_ID");
    }

    // 1. Tải thông tin đơn thuốc, đợt bóc tách AI và báo cáo an toàn gần nhất
    const prescription = await this.db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        extraction: {
          include: {
            medications: true,
          },
        },
        safetyReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            findings: true,
            ruleExecutions: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundError(`Không tìm thấy đơn thuốc với mã ID: ${prescriptionId}`);
    }

    const extraction = prescription.extraction;
    if (!extraction || extraction.status === "PENDING" || extraction.status === "PROCESSING") {
      throw new ExtractionNotReadyError(
        "Đơn thuốc chưa hoàn tất trích xuất cấu trúc AI để kiểm tra an toàn."
      );
    }

    const latestReport = prescription.safetyReports[0];

    // 2. Kiểm tra thao tác kép / Trùng lặp (Concurrency Guard)
    if (latestReport && latestReport.status === "PROCESSING") {
      throw new SafetyAlreadyProcessingError();
    }

    // 3. Kiểm tra tính Idempotent và phát hiện STALE
    if (latestReport && !options?.forceRerun) {
      const isStale = extraction.updatedAt > latestReport.extractionUpdatedAt;
      if (!isStale && (latestReport.status === "COMPLETED" || latestReport.status === "NEEDS_REVIEW" || latestReport.status === "INCOMPLETE")) {
        return this.formatReportData(latestReport, false);
      }
    }

    // 4. Xây dựng SafetyContext
    const medications = extraction.medications;
    const enrichedMeds: MedicationContextItem[] = [];

    for (const m of medications) {
      let activeIngredient: string | null = null;
      let genericName: string | null = null;

      const drugRefId = m.userConfirmedDrugId || m.matchedDrugId;
      if (drugRefId) {
        const drugItem = await this.drugRepo.getById(drugRefId);
        if (drugItem) {
          activeIngredient = drugItem.activeIngredient;
          genericName = drugItem.genericName;
        }
      }

      enrichedMeds.push({
        id: m.id,
        rawName: m.rawName,
        normalizedName: m.normalizedName,
        strength: m.strength,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        quantity: m.quantity,
        route: m.route,
        instructions: m.instructions,
        matchStatus: m.matchStatus as "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED",
        matchedDrugId: m.matchedDrugId,
        matchedDrugName: m.matchedDrugName,
        activeIngredient,
        genericName,
        userConfirmedDrugId: m.userConfirmedDrugId,
        userConfirmedName: m.userConfirmedName,
        reviewStatus: m.reviewStatus as "PENDING_REVIEW" | "CONFIRMED" | "REJECTED_UNKNOWN",
      });
    }

    // Tách thuốc đã xác nhận danh mục và thuốc chưa rõ ràng
    const confirmedMedications = enrichedMeds.filter(
      (m) => m.reviewStatus === "CONFIRMED" || m.matchStatus === "MATCHED"
    );
    const unresolvedMedications = enrichedMeds.filter(
      (m) => m.matchStatus === "UNMATCHED" || (m.matchStatus === "NEEDS_REVIEW" && m.reviewStatus !== "CONFIRMED")
    );

    // Xử lý hồ sơ dị ứng
    let userAllergies: string[] | null | undefined = options?.allergyProfile;
    if (userAllergies === undefined) {
      // Tra cứu bảng UserAllergyProfile nếu người dùng có session/user ID
      const queryFilter = [];
      if (prescription.userId) queryFilter.push({ userId: prescription.userId });
      if (prescription.sessionId) queryFilter.push({ sessionId: prescription.sessionId });

      if (queryFilter.length > 0) {
        const profiles = await this.db.userAllergyProfile.findMany({
          where: { OR: queryFilter },
        });
        if (profiles.length > 0) {
          userAllergies = profiles.map((p) => p.allergenName);
        } else {
          userAllergies = null;
        }
      } else {
        userAllergies = null;
      }
    }

    const context: SafetyContext = {
      prescriptionId,
      extractionId: extraction.id,
      extractionUpdatedAt: extraction.updatedAt,
      patientAge: extraction.patientAge,
      patientGender: extraction.patientGender,
      medications: enrichedMeds,
      allergyProfile: userAllergies,
      unresolvedMedications,
      confirmedMedications,
    };

    // 5. Đánh giá toàn bộ quy tắc qua SafetyEngine
    const evalResult = await this.engine.evaluate(context);
    const durationMs = Date.now() - startTime;

    // 6. Lưu trữ kết quả báo cáo an toàn vào CSDL thông qua Database Transaction
    const savedReport = await this.db.$transaction(async (tx) => {
      // Đánh dấu các báo cáo an toàn cũ là STALE
      await tx.safetyReport.updateMany({
        where: { prescriptionId },
        data: { isStale: true },
      });

      // Tạo bản ghi SafetyReport mới
      const newReport = await tx.safetyReport.create({
        data: {
          prescriptionId,
          extractionId: extraction.id,
          extractionUpdatedAt: extraction.updatedAt,
          status: evalResult.status,
          isStale: false,
          totalFindings: evalResult.summary.totalFindings,
          criticalCount: evalResult.summary.criticalCount,
          highCount: evalResult.summary.highCount,
          warningCount: evalResult.summary.warningCount,
          cautionCount: evalResult.summary.cautionCount,
          infoCount: evalResult.summary.infoCount,
          allergyCheckStatus: evalResult.allergyCheckStatus,
          interactionCheckStatus: evalResult.interactionCheckStatus,
          dosageCheckStatus: evalResult.dosageCheckStatus,
          duplicateCheckStatus: evalResult.duplicateCheckStatus,
          hasUnresolvedMedications: evalResult.hasUnresolvedMedications,
          summaryText: evalResult.summaryText,
          processingTimeMs: durationMs,
          findings: {
            create: evalResult.findings.map((f) => ({
              ruleId: f.ruleId,
              findingType: f.findingType,
              severity: f.severity,
              title: f.title,
              description: f.description,
              clinicalExplanation: f.clinicalExplanation || null,
              recommendationText: f.recommendationText || null,
              medicationIdsJson: JSON.stringify(f.medicationIds),
              drugNamesJson: JSON.stringify(f.drugNames),
              sourceId: f.sourceId,
              sourceName: f.sourceName,
              sourceVersion: f.sourceVersion,
              ruleVersion: f.ruleVersion,
            })),
          },
          ruleExecutions: {
            create: evalResult.ruleExecutions.map((r) => ({
              ruleId: r.ruleId,
              ruleName: r.ruleName,
              ruleVersion: r.ruleVersion,
              status: r.status,
              findingCount: r.findings.length,
              durationMs: r.durationMs,
              message: r.message || null,
            })),
          },
        },
        include: {
          findings: true,
          ruleExecutions: true,
        },
      });

      return newReport;
    });

    return this.formatReportData(savedReport, false);
  }

  /**
   * Lấy kết quả báo cáo an toàn hiện tại của đơn thuốc
   */
  public async getSafetyReport(prescriptionId: string): Promise<SafetyReportData> {
    if (!prescriptionId) {
      throw new ValidationError("Mã định danh đơn thuốc không hợp lệ.", 400, "INVALID_ID");
    }

    const prescription = await this.db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        extraction: true,
        safetyReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            findings: true,
            ruleExecutions: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundError(`Không tìm thấy đơn thuốc với mã ID: ${prescriptionId}`);
    }

    const latestReport = prescription.safetyReports[0];
    if (!latestReport) {
      throw new SafetyReportNotFoundError();
    }

    const isStale = Boolean(
      latestReport.isStale ||
      (prescription.extraction && prescription.extraction.updatedAt > latestReport.extractionUpdatedAt)
    );

    return this.formatReportData(latestReport, isStale);
  }

  private formatReportData(report: any, isStale: boolean): SafetyReportData {
    const formattedFindings: SafetyFindingData[] = (report.findings || []).map((f: any) => {
      let medicationIds: string[] = [];
      let drugNames: string[] = [];
      try {
        if (f.medicationIdsJson) medicationIds = JSON.parse(f.medicationIdsJson);
        if (f.drugNamesJson) drugNames = JSON.parse(f.drugNamesJson);
      } catch {
        // ignore
      }

      return {
        id: f.id,
        ruleId: f.ruleId,
        findingType: f.findingType,
        severity: f.severity,
        title: f.title,
        description: f.description,
        clinicalExplanation: f.clinicalExplanation,
        recommendationText: f.recommendationText,
        medicationIds,
        drugNames,
        sourceId: f.sourceId,
        sourceName: f.sourceName,
        sourceVersion: f.sourceVersion,
        ruleVersion: f.ruleVersion,
      };
    });

    return {
      id: report.id,
      prescriptionId: report.prescriptionId,
      extractionId: report.extractionId,
      status: isStale ? "STALE" : report.status,
      isStale,
      summary: {
        totalFindings: report.totalFindings,
        criticalCount: report.criticalCount,
        highCount: report.highCount,
        warningCount: report.warningCount,
        cautionCount: report.cautionCount,
        infoCount: report.infoCount,
      },
      allergyCheckStatus: report.allergyCheckStatus,
      interactionCheckStatus: report.interactionCheckStatus,
      dosageCheckStatus: report.dosageCheckStatus,
      duplicateCheckStatus: report.duplicateCheckStatus,
      hasUnresolvedMedications: report.hasUnresolvedMedications,
      summaryText: report.summaryText || "",
      processingTimeMs: report.processingTimeMs,
      findings: formattedFindings,
      ruleExecutions: (report.ruleExecutions || []).map((r: any) => ({
        ruleId: r.ruleId,
        ruleName: r.ruleName,
        ruleVersion: r.ruleVersion,
        status: r.status,
        findingCount: r.findingCount,
        durationMs: r.durationMs,
        message: r.message,
      })),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }
}

export const safetyService = new SafetyService();
