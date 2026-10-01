import { SafetyRule } from "./safety-rule";
import {
  SafetyContext,
  SafetyRuleExecutionResult,
  SafetyFindingData,
  DEV_TEST_DATA_NOTICE,
} from "../safety-types";
import { interactionRepository, buildPairKey } from "../repositories/interaction-repository";

/**
 * H4CARE Pharmacy - Rule 2: Drug-Drug Interaction Check
 * Phase 5: Deterministic Safety Engine
 */

export class InteractionRule implements SafetyRule {
  public readonly id = "RULE_INTERACTION";
  public readonly name = "Quy tắc kiểm tra tương tác giữa các thuốc trong đơn";
  public readonly version = "1.0.0";

  public async evaluate(context: SafetyContext): Promise<SafetyRuleExecutionResult> {
    const startTime = Date.now();
    const findings: SafetyFindingData[] = [];
    const meds = context.confirmedMedications;

    // Nếu đơn có ít hơn 2 loại thuốc, không có cặp tương tác cần kiểm tra
    if (meds.length < 2) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "COMPLETED",
        findings: [],
        durationMs: Date.now() - startTime,
        message: "Đơn thuốc có ít hơn 2 loại thuốc, không phát sinh cặp tương tác cần đối soát.",
      };
    }

    try {
      const evaluatedPairKeys = new Set<string>();

      // Duyệt qua tất cả các cặp thuốc duy nhất (Unique Pairs Only: A-B, A-C, B-C)
      // Không lặp lại B-A nhờ thuật toán i < j và chuẩn hóa buildPairKey
      for (let i = 0; i < meds.length; i++) {
        for (let j = i + 1; j < meds.length; j++) {
          const medA = meds[i];
          const medB = meds[j];

          const nameA = medA.matchedDrugName || medA.normalizedName;
          const nameB = medB.matchedDrugName || medB.normalizedName;
          const pairKey = buildPairKey(nameA, nameB);

          if (evaluatedPairKeys.has(pairKey)) {
            continue;
          }
          evaluatedPairKeys.add(pairKey);

          const interaction = await interactionRepository.findInteraction(
            nameA,
            nameB,
            medA.activeIngredient || medA.genericName,
            medB.activeIngredient || medB.genericName
          );

          if (interaction) {
            findings.push({
              ruleId: this.id,
              findingType: "DRUG_INTERACTION",
              severity: interaction.severity,
              title: interaction.title,
              description: interaction.clinicalExplanation,
              clinicalExplanation: interaction.clinicalExplanation,
              recommendationText: interaction.recommendation,
              medicationIds: [medA.id, medB.id],
              drugNames: [medA.matchedDrugName || medA.rawName, medB.matchedDrugName || medB.rawName],
              sourceId: interaction.sourceId,
              sourceName: interaction.sourceName,
              sourceVersion: interaction.sourceVersion,
              ruleVersion: this.version,
            });
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
        message: `Đã kiểm tra ${evaluatedPairKeys.size} cặp thuốc duy nhất.`,
      };
    } catch (err: any) {
      // Nguyên tắc Fail-closed: Nếu repository lỗi, báo FAILED và tạo cảnh báo dữ liệu không hoàn tất
      findings.push({
        ruleId: this.id,
        findingType: "INSUFFICIENT_DATA",
        severity: "WARNING",
        title: "Không thể hoàn tất kiểm tra tương tác thuốc (Nguồn dữ liệu không khả dụng)",
        description:
          "Hệ thống tra cứu tương tác thuốc tạm thời gián đoạn. Theo nguyên tắc an toàn lâm sàng (Fail-closed), không thể xác nhận đơn thuốc không có tương tác.",
        recommendationText:
          "Vui lòng thử lại sau hoặc nhờ bác sĩ / dược sĩ xác nhận trực tiếp trước khi cấp phát thuốc.",
        medicationIds: [],
        drugNames: [],
        sourceId: "INTERACTION_PROVIDER_ERROR",
        sourceName: DEV_TEST_DATA_NOTICE,
        sourceVersion: "1.0.0-dev",
        ruleVersion: this.version,
      });

      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "FAILED",
        findings,
        durationMs: Date.now() - startTime,
        message: err?.message || "Lỗi nhà cung cấp dữ liệu tương tác thuốc.",
      };
    }
  }
}
