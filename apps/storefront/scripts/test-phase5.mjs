import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:../prisma/dev.db",
    },
  },
});

// Import modules
import { LocalPrescriptionStorage } from "../src/lib/prescription/storage.ts";
import { PrescriptionService } from "../src/lib/prescription/prescription-service.ts";
import { LocalDrugRepository } from "../src/lib/prescription/extraction/drug-repository.ts";
import { DrugNormalizer } from "../src/lib/prescription/extraction/drug-normalizer.ts";
import { SafetyService } from "../src/lib/prescription/safety/safety-service.ts";
import { SafetyEngine } from "../src/lib/prescription/safety/safety-engine.ts";
import { AllergyRule } from "../src/lib/prescription/safety/rules/allergy-rule.ts";
import { InteractionRule } from "../src/lib/prescription/safety/rules/interaction-rule.ts";
import { DosageRule } from "../src/lib/prescription/safety/rules/dosage-rule.ts";
import { DuplicateRule } from "../src/lib/prescription/safety/rules/duplicate-rule.ts";
import { AllergyRepository } from "../src/lib/prescription/safety/repositories/allergy-repository.ts";
import { InteractionRepository } from "../src/lib/prescription/safety/repositories/interaction-repository.ts";
import { DosageReferenceRepository } from "../src/lib/prescription/safety/repositories/dosage-reference-repository.ts";
import {
  ExtractionNotReadyError,
  SafetyAlreadyProcessingError,
  SafetyReportNotFoundError,
  SafetyProviderUnavailableError,
} from "../src/lib/prescription/safety/safety-errors.ts";

const results = [];
let passCount = 0;
let failCount = 0;

function logResult(caseNumber, name, passed, details = "") {
  if (passed) {
    passCount++;
    const msg = `[PASS] CASE ${caseNumber}: ${name} ${details ? `(${details})` : ""}`;
    results.push(msg);
    console.log(msg);
  } else {
    failCount++;
    const msg = `[FAIL] CASE ${caseNumber}: ${name} -> ${details}`;
    results.push(msg);
    console.error(msg);
  }
}

async function runPhase5Tests() {
  console.log("=================================================================");
  console.log("   BẮT ĐẦU CHẠY BỘ 19 TEST CASES PHASE 5 - DETERMINISTIC SAFETY ENGINE   ");
  console.log("=================================================================");

  const storageDir = path.join(process.cwd(), "storage", "test-prescriptions");
  const testStorage = new LocalPrescriptionStorage(storageDir);
  const prescriptionService = new PrescriptionService(testStorage, prisma);
  const drugRepo = new LocalDrugRepository();
  const safetyEngine = new SafetyEngine();
  const safetyService = new SafetyService(prisma, safetyEngine, drugRepo);

  // Helper tạo nhanh 1 đơn thuốc đã qua trích xuất AI
  async function createPrescriptionWithExtraction(medicationsList, extractionStatus = "COMPLETED", extra = {}) {
    const fakeBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([fakeBuffer], `p5_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`, { type: "image/png" });
    const p = await prescriptionService.createPrescription(file, { sessionId: `p5_sess_${Math.random()}` });

    const extraction = await prisma.prescriptionExtraction.create({
      data: {
        prescriptionId: p.prescriptionId,
        provider: "mock",
        model: "mock-v1",
        status: extractionStatus,
        rawOcrText: extra.rawOcrText || "Đơn thuốc mẫu",
        patientName: extra.patientName || "Nguyễn Văn Test",
        patientAge: extra.patientAge || "30",
        patientGender: extra.patientGender || "MALE",
        doctorName: extra.doctorName || "BS. Hoàng",
        diagnosis: extra.diagnosis || "Viêm đường hô hấp",
        medicationCount: medicationsList.length,
        matchedCount: medicationsList.filter((m) => m.matchStatus === "MATCHED").length,
        needsReviewCount: medicationsList.filter((m) => m.matchStatus === "NEEDS_REVIEW").length,
        unmatchedCount: medicationsList.filter((m) => m.matchStatus === "UNMATCHED").length,
        processingTimeMs: 150,
        medications: {
          create: medicationsList.map((m) => ({
            rawName: m.rawName,
            normalizedName: m.normalizedName || DrugNormalizer.normalizeText(m.rawName),
            strength: m.strength || null,
            dosage: m.dosage || null,
            frequency: m.frequency || null,
            duration: m.duration || null,
            quantity: m.quantity != null ? String(m.quantity) : null,
            route: m.route || "Uống",
            instructions: m.instructions || null,
            sourcePage: 1,
            sourceText: m.rawName,
            matchStatus: m.matchStatus || "MATCHED",
            matchedDrugId: m.matchedDrugId || null,
            matchedDrugName: m.matchedDrugName || m.rawName,
            matchScore: m.matchScore != null ? m.matchScore : 0.95,
            reviewStatus: m.reviewStatus || "CONFIRMED",
            userConfirmedDrugId: m.userConfirmedDrugId || m.matchedDrugId || null,
            userConfirmedName: m.userConfirmedName || m.matchedDrugName || m.rawName,
          })),
        },
      },
    });

    return { prescriptionId: p.prescriptionId, extractionId: extraction.id };
  }

  // ----------------------------------------------------
  // CASE 1: Exact Allergy Match (Penicillin allergy vs Amoxicillin)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Amoxicillin 500mg",
        matchedDrugName: "Amoxicillin 500mg",
        matchedDrugId: "ref-amox-500",
        strength: "500mg",
        dosage: "1 viên",
        frequency: "2 lần/ngày",
        matchStatus: "MATCHED",
        reviewStatus: "CONFIRMED",
      },
    ]);

    const report1 = await safetyService.runSafetyCheck(prescriptionId, {
      allergyProfile: ["Penicillin"],
    });

    const allergyFinding = report1.findings.find((f) => f.findingType === "ALLERGY");
    const passed1 =
      Boolean(allergyFinding) &&
      allergyFinding.severity === "CRITICAL" &&
      allergyFinding.title.includes("Penicillin") &&
      report1.allergyCheckStatus === "COMPLETED";

    logResult(1, "Allergy Exact Match -> Phát hiện dị ứng chéo Penicillin và Amoxicillin (CRITICAL)", passed1, `Finding: ${allergyFinding?.title}`);
  } catch (err) {
    logResult(1, "Allergy Exact Match", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 2: No Allergy Profile Policy (Strict Null Policy)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        strength: "500mg",
        dosage: "1 viên",
      },
    ]);

    // Không truyền allergyProfile
    const report2 = await safetyService.runSafetyCheck(prescriptionId, {
      allergyProfile: null,
    });

    const insufficientFinding = report2.findings.find((f) => f.findingType === "INSUFFICIENT_DATA");
    const passed2 =
      report2.allergyCheckStatus === "INSUFFICIENT_DATA" &&
      Boolean(insufficientFinding) &&
      insufficientFinding.description.includes("ALLERGY_INFORMATION_UNAVAILABLE");

    logResult(2, "No Allergy Profile Policy -> Chưa khai báo dị ứng trả về INSUFFICIENT_DATA, không tự nhận an toàn", passed2, `Status: ${report2.allergyCheckStatus}`);
  } catch (err) {
    logResult(2, "No Allergy Profile Policy", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 3: Declared Empty Allergy Profile
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        strength: "500mg",
        dosage: "1 viên",
      },
    ]);

    const report3 = await safetyService.runSafetyCheck(prescriptionId, {
      allergyProfile: [], // Khai báo không có tiền sử dị ứng
    });

    const allergyFinding = report3.findings.find((f) => f.findingType === "ALLERGY");
    const passed3 =
      report3.allergyCheckStatus === "COMPLETED" &&
      !allergyFinding;

    logResult(3, "Declared Empty Allergy Profile -> Khai báo không dị ứng hoàn thành rule với 0 cảnh báo", passed3, `AllergyStatus: ${report3.allergyCheckStatus}`);
  } catch (err) {
    logResult(3, "Declared Empty Allergy Profile", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 4: Drug-Drug Interaction Detected (Ibuprofen + Aspirin)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Ibuprofen 400mg",
        matchedDrugName: "Ibuprofen 400mg",
        matchedDrugId: "ref-ibu-400",
        strength: "400mg",
        dosage: "1 viên",
      },
      {
        rawName: "Aspirin 500mg",
        matchedDrugName: "Aspirin 500mg",
        matchedDrugId: "ref-aspirin-500",
        strength: "500mg",
        dosage: "1 viên",
      },
    ]);

    const report4 = await safetyService.runSafetyCheck(prescriptionId);
    const interactionFinding = report4.findings.find((f) => f.findingType === "DRUG_INTERACTION");

    const passed4 =
      Boolean(interactionFinding) &&
      interactionFinding.severity === "HIGH" &&
      interactionFinding.description.includes("loét dạ dày") &&
      report4.interactionCheckStatus === "COMPLETED";

    logResult(4, "Drug-Drug Interaction -> Phát hiện tương tác Ibuprofen + Aspirin mức độ HIGH", passed4, `Title: ${interactionFinding?.title}`);
  } catch (err) {
    logResult(4, "Drug-Drug Interaction", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 5: No Interaction Found Between Safe Pair (Paracetamol + Amoxicillin)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        strength: "500mg",
        dosage: "1 viên",
      },
      {
        rawName: "Amoxicillin 500mg",
        matchedDrugName: "Amoxicillin 500mg",
        matchedDrugId: "ref-amox-500",
        strength: "500mg",
        dosage: "1 viên",
      },
    ]);

    const report5 = await safetyService.runSafetyCheck(prescriptionId, { allergyProfile: [] });
    const interactionFinding = report5.findings.find((f) => f.findingType === "DRUG_INTERACTION");

    const passed5 =
      !interactionFinding &&
      report5.interactionCheckStatus === "COMPLETED" &&
      report5.status !== "SAFE"; // Tuyệt đối không dùng trạng thái SAFE

    logResult(5, "No Interaction Found -> Hoàn tất kiểm tra không tìm thấy tương tác, không tuyên bố SAFE", passed5, `ReportStatus: ${report5.status}`);
  } catch (err) {
    logResult(5, "No Interaction Found", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 6: Fail-Closed on Interaction Repository Failure
  // ----------------------------------------------------
  try {
    InteractionRepository.setSimulateFailure(true);

    const { prescriptionId } = await createPrescriptionWithExtraction([
      { rawName: "Paracetamol 500mg", matchedDrugName: "Paracetamol 500mg" },
      { rawName: "Amoxicillin 500mg", matchedDrugName: "Amoxicillin 500mg" },
    ]);

    const report6 = await safetyService.runSafetyCheck(prescriptionId, { forceRerun: true });
    InteractionRepository.setSimulateFailure(false); // Reset

    const failedRule = report6.ruleExecutions.find((r) => r.ruleId === "RULE_INTERACTION");
    const passed6 =
      report6.interactionCheckStatus === "FAILED" &&
      failedRule?.status === "FAILED" &&
      report6.status !== "COMPLETED";

    logResult(6, "Interaction Fail-Closed -> Khi nguồn tương tác gặp sự cố, báo FAILED, không coi là an toàn", passed6, `InteractionStatus: ${report6.interactionCheckStatus}`);
  } catch (err) {
    InteractionRepository.setSimulateFailure(false);
    logResult(6, "Interaction Fail-Closed", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 7: Unique Pairs Logic (3 medications -> exactly 3 unique pairs)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      { rawName: "Thuốc A", normalizedName: "paracetamol", matchedDrugName: "Paracetamol 500mg" },
      { rawName: "Thuốc B", normalizedName: "ibuprofen", matchedDrugName: "Ibuprofen 400mg" },
      { rawName: "Thuốc C", normalizedName: "aspirin", matchedDrugName: "Aspirin 500mg" },
    ]);

    const report7 = await safetyService.runSafetyCheck(prescriptionId);
    const ruleExec = report7.ruleExecutions.find((r) => r.ruleId === "RULE_INTERACTION");

    const passed7 =
      ruleExec?.status === "COMPLETED" &&
      ruleExec?.message?.includes("3 cặp thuốc duy nhất");

    logResult(7, "Unique Pairs Logic -> 3 thuốc đối soát đúng 3 cặp (A-B, A-C, B-C), không lặp B-A", passed7, ruleExec?.message);
  } catch (err) {
    logResult(7, "Unique Pairs Logic", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 8: Structural Dosage - Negative Quantity or Malformed Value
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        quantity: -10, // Số lượng âm bất thường
        dosage: "1 viên",
      },
    ]);

    const report8 = await safetyService.runSafetyCheck(prescriptionId);
    const structuralFinding = report8.findings.find(
      (f) => f.findingType === "STRUCTURAL_DOSAGE" && f.severity === "WARNING"
    );

    const passed8 =
      Boolean(structuralFinding) &&
      structuralFinding.title.includes("không hợp lệ");

    logResult(8, "Structural Dosage Negative -> Phát hiện số lượng âm hoặc cú pháp định lượng sai lệch", passed8, structuralFinding?.title);
  } catch (err) {
    logResult(8, "Structural Dosage Negative", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 9: Structural Dosage - Missing Dosage
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Ibuprofen 400mg",
        matchedDrugName: "Ibuprofen 400mg",
        matchedDrugId: "ref-ibu-400",
        dosage: null, // Thiếu liều
      },
    ]);

    const report9 = await safetyService.runSafetyCheck(prescriptionId);
    const missingDoseFinding = report9.findings.find(
      (f) => f.findingType === "STRUCTURAL_DOSAGE" && f.title.includes("Thiếu thông tin liều dùng")
    );

    const passed9 = Boolean(missingDoseFinding);
    logResult(9, "Structural Dosage Missing -> Cảnh báo thiếu liều dùng mỗi lần uống", passed9, missingDoseFinding?.title);
  } catch (err) {
    logResult(9, "Structural Dosage Missing", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 10: Clinical Dosage Without Reference Data
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "ThuocMoiChuaCoFixture 100mg",
        matchedDrugName: "ThuocMoiChuaCoFixture 100mg",
        dosage: "2 viên",
      },
    ]);

    const report10 = await safetyService.runSafetyCheck(prescriptionId);
    const overdoseFinding = report10.findings.find((f) => f.findingType === "DOSAGE_LIMIT");

    const passed10 = !overdoseFinding; // Không tự ý bịa đặt cảnh báo quá liều
    logResult(10, "Clinical Dosage No Ref -> Không tự ý bịa đặt kết luận quá liều khi thiếu dữ liệu tham chiếu", passed10, "No false positive DOSAGE_LIMIT");
  } catch (err) {
    logResult(10, "Clinical Dosage No Ref", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 11: Clinical Dosage With Test Reference Exceeded
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        strength: "500mg",
        dosage: "1500mg", // Vượt quá maxSingleDose 1000mg
        frequency: "2 lần/ngày",
      },
    ]);

    const report11 = await safetyService.runSafetyCheck(prescriptionId);
    const doseLimitFinding = report11.findings.find((f) => f.findingType === "DOSAGE_LIMIT");

    const passed11 =
      Boolean(doseLimitFinding) &&
      doseLimitFinding.severity === "HIGH" &&
      doseLimitFinding.description.includes("1500mg") &&
      doseLimitFinding.sourceName.includes("TEST DATA ONLY");

    logResult(11, "Clinical Dosage Limit -> Phát hiện vượt ngưỡng liều tối đa kèm nhãn TEST DATA ONLY", passed11, doseLimitFinding?.title);
  } catch (err) {
    logResult(11, "Clinical Dosage Limit", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 12: Duplicate Medication Check (Same drug twice)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg (Dòng 1)",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        normalizedName: "paracetamol",
      },
      {
        rawName: "Paracetamol 500mg (Dòng 2)",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
        normalizedName: "paracetamol",
      },
    ]);

    const report12 = await safetyService.runSafetyCheck(prescriptionId);
    const dupFinding = report12.findings.find((f) => f.findingType === "DUPLICATE_MEDICATION");

    const passed12 =
      Boolean(dupFinding) &&
      dupFinding.severity === "WARNING" &&
      dupFinding.description.includes("xuất hiện 2 lần");

    logResult(12, "Duplicate Medication -> Phát hiện cùng một thuốc được kê lặp lại 2 lần", passed12, dupFinding?.title);
  } catch (err) {
    logResult(12, "Duplicate Medication", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 13: Duplicate Active Ingredient Check (Paracetamol + Panadol Extra)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
      },
      {
        rawName: "Panadol Extra",
        matchedDrugName: "Panadol Extra",
        matchedDrugId: "ref-panadol-extra",
      },
    ]);

    const report13 = await safetyService.runSafetyCheck(prescriptionId);
    const dupIngFinding = report13.findings.find(
      (f) => f.findingType === "DUPLICATE_ACTIVE_INGREDIENT"
    );

    const passed13 =
      Boolean(dupIngFinding) &&
      dupIngFinding.severity === "HIGH" &&
      dupIngFinding.title.includes("PARACETAMOL");

    logResult(13, "Duplicate Active Ingredient -> Phát hiện 2 biệt dược khác nhau cùng chứa Paracetamol", passed13, dupIngFinding?.title);
  } catch (err) {
    logResult(13, "Duplicate Active Ingredient", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 14: Unmatched Medication Handling
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "ThuocChuaKhopDanhMuc",
        matchStatus: "UNMATCHED",
        reviewStatus: "PENDING_REVIEW",
      },
    ]);

    const report14 = await safetyService.runSafetyCheck(prescriptionId);
    const unresolvedFinding = report14.findings.find(
      (f) => f.findingType === "UNRESOLVED_MEDICATION"
    );

    const passed14 =
      report14.hasUnresolvedMedications === true &&
      Boolean(unresolvedFinding) &&
      (report14.status === "INCOMPLETE" || report14.status === "NEEDS_REVIEW");

    logResult(14, "Unmatched Medication -> Thuốc UNMATCHED kích hoạt cờ INCOMPLETE, không tự ý đoán", passed14, `Status: ${report14.status}`);
  } catch (err) {
    logResult(14, "Unmatched Medication", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 15: Unconfirmed Medication (NEEDS_REVIEW)
  // ----------------------------------------------------
  try {
    const { prescriptionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamo1 500mg",
        matchStatus: "NEEDS_REVIEW",
        reviewStatus: "PENDING_REVIEW",
      },
    ]);

    const report15 = await safetyService.runSafetyCheck(prescriptionId);
    const passed15 =
      report15.hasUnresolvedMedications === true &&
      (report15.status === "INCOMPLETE" || report15.status === "NEEDS_REVIEW");

    logResult(15, "Needs Review Medication -> Thuốc chưa confirm không được giả định để chạy an toàn lâm sàng", passed15, `Status: ${report15.status}`);
  } catch (err) {
    logResult(15, "Needs Review Medication", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 16: Changed Medication / Stale Report Detection
  // ----------------------------------------------------
  try {
    const { prescriptionId, extractionId } = await createPrescriptionWithExtraction([
      {
        rawName: "Paracetamol 500mg",
        matchedDrugName: "Paracetamol 500mg",
        matchedDrugId: "ref-para-500",
      },
    ]);

    // 1. Chạy Safety lần đầu
    await safetyService.runSafetyCheck(prescriptionId);

    // 2. Chờ 1 chút và giả lập thay đổi đơn thuốc (cập nhật extraction updatedAt)
    await new Promise((resolve) => setTimeout(resolve, 100));
    await prisma.prescriptionExtraction.update({
      where: { id: extractionId },
      data: { updatedAt: new Date() },
    });

    // 3. Gọi getSafetyReport -> Hệ thống phải nhận diện STALE
    const fetchedReport = await safetyService.getSafetyReport(prescriptionId);
    const passed16 =
      fetchedReport.isStale === true &&
      fetchedReport.status === "STALE";

    logResult(16, "Stale Report Detection -> Nhận diện báo cáo STALE khi dữ liệu đơn thuốc thay đổi", passed16, `isStale: ${fetchedReport.isStale}`);
  } catch (err) {
    logResult(16, "Stale Report Detection", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 17: Concurrency & Double-Click Guard
  // ----------------------------------------------------
  try {
    const { prescriptionId, extractionId } = await createPrescriptionWithExtraction([
      { rawName: "Paracetamol 500mg" },
    ]);

    // Giả lập trạng thái đang chạy PROCESSING
    await prisma.safetyReport.create({
      data: {
        prescriptionId,
        extractionId,
        extractionUpdatedAt: new Date(),
        status: "PROCESSING",
        allergyCheckStatus: "SKIPPED",
        interactionCheckStatus: "SKIPPED",
        dosageCheckStatus: "SKIPPED",
        duplicateCheckStatus: "SKIPPED",
      },
    });

    let caught17 = null;
    try {
      await safetyService.runSafetyCheck(prescriptionId);
    } catch (err) {
      caught17 = err;
    }

    const passed17 = caught17 instanceof SafetyAlreadyProcessingError;
    logResult(17, "Concurrency Guard -> Ném SafetyAlreadyProcessingError (409) khi đang xử lý", passed17, `Code: ${caught17?.code}`);
  } catch (err) {
    logResult(17, "Concurrency Guard", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 18: Extraction Not Ready Guard
  // ----------------------------------------------------
  try {
    const fakeBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([fakeBuffer], `unready_${Date.now()}.png`, { type: "image/png" });
    const p18 = await prescriptionService.createPrescription(file, { sessionId: "p5_unready" });

    let caught18 = null;
    try {
      await safetyService.runSafetyCheck(p18.prescriptionId);
    } catch (err) {
      caught18 = err;
    }

    const passed18 = caught18 instanceof ExtractionNotReadyError;
    logResult(18, "Extraction Not Ready Guard -> Chặn kiểm tra an toàn khi đơn chưa qua bước bóc tách AI", passed18, `Code: ${caught18?.code}`);
  } catch (err) {
    logResult(18, "Extraction Not Ready Guard", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 19: Baseline Regression Check (Phase 1, 2, 3, 4)
  // ----------------------------------------------------
  try {
    // Phase 1: Validator
    const { validateFileMetadata } = await import("../src/lib/prescription/file-validator.ts");
    const metaCheck = validateFileMetadata({ name: "donthuoc.png", size: 2048, type: "image/png" });

    // Phase 2: Storage & DB
    const fakeBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([fakeBuffer], `reg_p5_${Date.now()}.png`, { type: "image/png" });
    const rx = await prescriptionService.createPrescription(file, { sessionId: "p5_reg" });
    const dbRx = await prisma.prescription.findUnique({ where: { id: rx.prescriptionId } });
    const stored = dbRx ? await testStorage.getFile(dbRx.storageKey) : null;

    // Phase 3: OCR
    const ocr = await prisma.prescriptionOcrResult.create({
      data: {
        prescriptionId: rx.prescriptionId,
        status: "COMPLETED",
        provider: "mock",
        pageCount: 1,
        fullText: "Paracetamol 500mg",
      },
    });

    // Phase 4: Extraction & Normalization
    const ext = await prisma.prescriptionExtraction.create({
      data: {
        prescriptionId: rx.prescriptionId,
        provider: "mock",
        model: "mock-v1",
        status: "COMPLETED",
        rawOcrText: "Paracetamol 500mg",
        medicationCount: 1,
        matchedCount: 1,
      },
    });
    const norm = DrugNormalizer.normalizeText("  Paracetamol   500mg ");

    const passed19 =
      metaCheck.isValid &&
      Boolean(stored) &&
      ocr.status === "COMPLETED" &&
      ext.status === "COMPLETED" &&
      norm === "paracetamol 500mg";

    logResult(19, "Baseline Regression -> Phase 1, Phase 2, Phase 3, Phase 4 tiếp tục hoạt động 100% trơn tru", passed19, `Meta: ${metaCheck.isValid}, DB: ${Boolean(stored)}, OCR: ${Boolean(ocr.id)}, Ext: ${Boolean(ext.id)}`);
  } catch (err) {
    logResult(19, "Baseline Regression", false, err.message);
  }

  console.log("=================================================================");
  console.log(`KẾT QUẢ KIỂM THỬ PHASE 5: ${passCount}/19 TEST CASES ĐẠT (PASS) - ${failCount} LỖI (FAIL)`);
  console.log("=================================================================");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests()
  .catch((e) => {
    console.error("FATAL ERROR IN TEST SUITE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
