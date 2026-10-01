import { SafetyRule } from "./safety-rule";
import {
  SafetyContext,
  SafetyRuleExecutionResult,
  SafetyFindingData,
  DEV_TEST_DATA_NOTICE,
} from "../safety-types";
import { dosageReferenceRepository } from "../repositories/dosage-reference-repository";

/**
 * H4CARE Pharmacy - Rule 3: Dosage / Usage Check
 * Phase 5: Deterministic Safety Engine
 */

export class DosageRule implements SafetyRule {
  public readonly id = "RULE_DOSAGE";
  public readonly name = "Quy tắc kiểm tra cấu trúc định lượng & Ngưỡng liều tham chiếu";
  public readonly version = "1.0.0";

  public async evaluate(context: SafetyContext): Promise<SafetyRuleExecutionResult> {
    const startTime = Date.now();
    const findings: SafetyFindingData[] = [];

    try {
      for (const med of context.medications) {
        const drugTarget = med.matchedDrugName || med.rawName;

        // ====================================================
        // A. STRUCTURAL DOSAGE CHECKS (Kiểm tra cấu trúc dữ liệu)
        // ====================================================

        // 1. Kiểm tra giá trị âm hoặc cú pháp định lượng bất thường (< 0)
        const hasNegativeQuantity =
          (med.quantity && (parseInt(med.quantity, 10) < 0 || med.quantity.includes("-"))) ||
          (med.dosage && (med.dosage.includes("-") && /\-\s*\d+/.test(med.dosage)));

        if (hasNegativeQuantity) {
          findings.push({
            ruleId: this.id,
            findingType: "STRUCTURAL_DOSAGE",
            severity: "WARNING",
            title: `Dữ liệu số lượng / liều dùng không hợp lệ: ${drugTarget}`,
            description: `Ghi nhận giá trị số âm hoặc cú pháp định lượng bất thường (VD: "${med.quantity || med.dosage}") trong đơn thuốc.`,
            clinicalExplanation: "Dữ liệu định lượng bất thường có thể do lỗi quét OCR hoặc văn bản gốc bị nhầm lẫn.",
            recommendationText: "Cần kiểm tra lại đơn thuốc gốc để xác định số lượng chính xác.",
            medicationIds: [med.id],
            drugNames: [drugTarget],
            sourceId: "DOSAGE_STRUCTURAL_INVALID_NUM",
            sourceName: DEV_TEST_DATA_NOTICE,
            sourceVersion: "1.0.0-dev",
            ruleVersion: this.version,
          });
        }

        // 2. Kiểm tra thiếu thông tin liều dùng (Missing Dosage)
        if (!med.dosage || med.dosage.trim() === "") {
          findings.push({
            ruleId: this.id,
            findingType: "STRUCTURAL_DOSAGE",
            severity: "CAUTION",
            title: `Thiếu thông tin liều dùng: ${drugTarget}`,
            description: "Đơn thuốc không thể hiện rõ liều dùng mỗi lần uống (ví dụ: số viên, gói, ml).",
            recommendationText: "Cần tham vấn bác sĩ hoặc dược sĩ chỉ dẫn liều dùng cụ thể.",
            medicationIds: [med.id],
            drugNames: [drugTarget],
            sourceId: "DOSAGE_STRUCTURAL_MISSING",
            sourceName: DEV_TEST_DATA_NOTICE,
            sourceVersion: "1.0.0-dev",
            ruleVersion: this.version,
          });
        }

        // 3. Kiểm tra thiếu tần suất dùng (Missing Frequency)
        if (!med.frequency || med.frequency.trim() === "") {
          findings.push({
            ruleId: this.id,
            findingType: "STRUCTURAL_DOSAGE",
            severity: "INFO",
            title: `Thiếu tần suất dùng thuốc: ${drugTarget}`,
            description: "Đơn thuốc không ghi rõ số lần dùng trong ngày (ví dụ: 2 lần/ngày, cách 8 giờ).",
            recommendationText: "Cần làm rõ số lần uống trong ngày trước khi sử dụng.",
            medicationIds: [med.id],
            drugNames: [drugTarget],
            sourceId: "DOSAGE_STRUCTURAL_NO_FREQ",
            sourceName: DEV_TEST_DATA_NOTICE,
            sourceVersion: "1.0.0-dev",
            ruleVersion: this.version,
          });
        }

        // ====================================================
        // B. CLINICAL DOSAGE CHECK (Kiểm tra liều lâm sàng có kiểm soát)
        // Chỉ chạy khi thuốc đã xác nhận và có nguồn tham chiếu chính thức
        // ====================================================
        if (med.matchStatus === "MATCHED" || med.reviewStatus === "CONFIRMED") {
          const dosageRef = await dosageReferenceRepository.findDosageReference(
            med.matchedDrugName || med.normalizedName
          );

          // Nếu KHÔNG có nguồn tham chiếu chính thức: Tuyệt đối không tự suy diễn hoặc bịa đặt kết luận quá liều!
          if (dosageRef) {
            const parsedStrengthMg = this.parseMg(med.strength || med.dosage);
            const parsedDoseMg = this.parseMg(med.dosage) || parsedStrengthMg;
            const frequencyTimes = this.parseFrequencyTimes(med.frequency);

            // Kiểm tra liều đơn lần (Single Dose Limit)
            if (parsedDoseMg && parsedDoseMg > dosageRef.maxSingleDoseMg) {
              findings.push({
                ruleId: this.id,
                findingType: "DOSAGE_LIMIT",
                severity: "HIGH",
                title: `Liều đơn lần vượt ngưỡng tham chiếu: ${drugTarget}`,
                description: `Liều ghi nhận (${parsedDoseMg}mg/lần) vượt quá ngưỡng liều tối đa 1 lần khuyến cáo (${dosageRef.maxSingleDoseMg}mg) theo tài liệu tham chiếu kiểm thử.`,
                clinicalExplanation: dosageRef.clinicalNote,
                recommendationText: "Cần được dược sĩ/bác sĩ kiểm tra và hiệu chỉnh lại liều lượng phù hợp.",
                medicationIds: [med.id],
                drugNames: [drugTarget],
                sourceId: dosageRef.sourceId,
                sourceName: dosageRef.sourceName,
                sourceVersion: dosageRef.sourceVersion,
                ruleVersion: this.version,
              });
            }

            // Kiểm tra tổng liều trong ngày (Daily Dose Limit)
            if (parsedDoseMg && frequencyTimes) {
              const estimatedDailyMg = parsedDoseMg * frequencyTimes;
              if (estimatedDailyMg > dosageRef.maxDailyDoseMg) {
                findings.push({
                  ruleId: this.id,
                  findingType: "DOSAGE_LIMIT",
                  severity: "HIGH",
                  title: `Tổng liều ngày vượt ngưỡng tham chiếu: ${drugTarget}`,
                  description: `Tổng liều ước tính (${estimatedDailyMg}mg/ngày = ${parsedDoseMg}mg x ${frequencyTimes} lần) vượt ngưỡng liều tối đa trong 24 giờ (${dosageRef.maxDailyDoseMg}mg/ngày).`,
                  clinicalExplanation: dosageRef.clinicalNote,
                  recommendationText: "Cần được dược sĩ/bác sĩ hội chẩn để tránh nguy cơ ngộ độc hoặc độc tính cơ quan.",
                  medicationIds: [med.id],
                  drugNames: [drugTarget],
                  sourceId: dosageRef.sourceId,
                  sourceName: dosageRef.sourceName,
                  sourceVersion: dosageRef.sourceVersion,
                  ruleVersion: this.version,
                });
              }
            }
          }
        }
      }

      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "COMPLETED",
        findings,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "FAILED",
        findings: [],
        durationMs: Date.now() - startTime,
        message: err?.message || "Lỗi kiểm tra quy tắc định lượng.",
      };
    }
  }

  private parseMg(text?: string | null): number | null {
    if (!text) return null;
    const mgMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:mg|miligram)/i);
    if (mgMatch) {
      return parseFloat(mgMatch[1].replace(",", "."));
    }
    const gMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram)/i);
    if (gMatch) {
      return parseFloat(gMatch[1].replace(",", ".")) * 1000;
    }
    return null;
  }

  private parseFrequencyTimes(frequencyText?: string | null): number | null {
    if (!frequencyText) return null;
    const timesMatch = frequencyText.match(/(\d+)\s*(?:lần|lan)/i);
    if (timesMatch) {
      return parseInt(timesMatch[1], 10);
    }
    const bidMatch = frequencyText.match(/\b(BID|2x|2\s*lần)\b/i);
    if (bidMatch) return 2;
    const tidMatch = frequencyText.match(/\b(TID|3x|3\s*lần)\b/i);
    if (tidMatch) return 3;
    const qidMatch = frequencyText.match(/\b(QID|4x|4\s*lần)\b/i);
    if (qidMatch) return 4;
    return null;
  }
}
