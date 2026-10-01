import { SafetyRule } from "./safety-rule";
import {
  SafetyContext,
  SafetyRuleExecutionResult,
  SafetyFindingData,
  DEV_TEST_DATA_NOTICE,
} from "../safety-types";
import { allergyRepository } from "../repositories/allergy-repository";

/**
 * H4CARE Pharmacy - Rule 1: Allergy Check
 * Phase 5: Deterministic Safety Engine
 */

export class AllergyRule implements SafetyRule {
  public readonly id = "RULE_ALLERGY";
  public readonly name = "Quy tắc kiểm tra dị ứng thuốc & hoạt chất";
  public readonly version = "1.0.0";

  public async evaluate(context: SafetyContext): Promise<SafetyRuleExecutionResult> {
    const startTime = Date.now();
    const findings: SafetyFindingData[] = [];

    // 1. Kiểm tra chính sách thiếu dữ liệu dị ứng (No Allergy Data Policy)
    // Nếu người dùng chưa khai báo dị ứng (null hoặc undefined), không được kết luận "Không có nguy cơ dị ứng"
    if (context.allergyProfile === null || context.allergyProfile === undefined) {
      findings.push({
        ruleId: this.id,
        findingType: "INSUFFICIENT_DATA",
        severity: "INFO",
        title: "Chưa có thông tin dị ứng để kiểm tra",
        description:
          "Hệ thống ghi nhận trạng thái ALLERGY_INFORMATION_UNAVAILABLE do người dùng chưa cung cấp hồ sơ dị ứng. Thiếu dữ liệu không đồng nghĩa với việc đơn thuốc an toàn tuyệt đối.",
        recommendationText:
          "Khuyến nghị tham vấn bác sĩ hoặc dược sĩ về tiền sử dị ứng trước khi sử dụng thuốc.",
        medicationIds: [],
        drugNames: [],
        sourceId: "ALLERGY_RULE_DEFAULT",
        sourceName: DEV_TEST_DATA_NOTICE,
        sourceVersion: "1.0.0-dev",
        ruleVersion: this.version,
      });

      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "INSUFFICIENT_DATA",
        findings,
        durationMs: Date.now() - startTime,
        message: "Chưa có thông tin dị ứng để kiểm tra.",
      };
    }

    // Nếu người dùng đã khai báo danh sách rỗng (khai báo không có tiền sử dị ứng)
    if (context.allergyProfile.length === 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "COMPLETED",
        findings: [],
        durationMs: Date.now() - startTime,
        message: "Không phát hiện yếu tố nguy cơ dị ứng từ dữ liệu đã khai báo.",
      };
    }

    try {
      // 2. Đối chiếu dị ứng với từng thuốc đã xác nhận trong đơn
      for (const med of context.confirmedMedications) {
        const drugTarget = med.matchedDrugName || med.normalizedName;
        const matches = await allergyRepository.findMatches(
          context.allergyProfile,
          drugTarget,
          med.activeIngredient || med.genericName
        );

        for (const match of matches) {
          findings.push({
            ruleId: this.id,
            findingType: "ALLERGY",
            severity: match.severity,
            title: `Cảnh báo tiền sử dị ứng: ${match.allergenName} - ${drugTarget}`,
            description: match.clinicalNote,
            clinicalExplanation: `Phát hiện nguy cơ dị ứng chéo hoặc phản ứng quá mẫn giữa dị ứng '${match.allergenName}' và thuốc '${drugTarget}'.`,
            recommendationText: "Cần được dược sĩ/bác sĩ kiểm tra tiền sử dị ứng trước khi sử dụng.",
            medicationIds: [med.id],
            drugNames: [drugTarget],
            sourceId: match.sourceId,
            sourceName: match.sourceName,
            sourceVersion: match.sourceVersion,
            ruleVersion: this.version,
          });
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
        message: err?.message || "Lỗi tra cứu dữ liệu dị ứng thuốc.",
      };
    }
  }
}
