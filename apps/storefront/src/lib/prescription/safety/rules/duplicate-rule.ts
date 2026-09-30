import { SafetyRule } from "./safety-rule";
import {
  SafetyContext,
  SafetyRuleExecutionResult,
  SafetyFindingData,
  DEV_TEST_DATA_NOTICE,
} from "../safety-types";

/**
 * H4CARE Pharmacy - Rule 4: Duplicate Medication & Active Ingredient Check
 * Phase 5: Deterministic Safety Engine
 */

export class DuplicateRule implements SafetyRule {
  public readonly id = "RULE_DUPLICATE";
  public readonly name = "Quy tắc kiểm tra trùng lặp chỉ định & trùng lặp hoạt chất";
  public readonly version = "1.0.0";

  public async evaluate(context: SafetyContext): Promise<SafetyRuleExecutionResult> {
    const startTime = Date.now();
    const findings: SafetyFindingData[] = [];
    const meds = context.medications;

    if (meds.length < 2) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        ruleVersion: this.version,
        status: "COMPLETED",
        findings: [],
        durationMs: Date.now() - startTime,
        message: "Đơn thuốc có ít hơn 2 dòng thuốc, không có nguy cơ trùng lặp.",
      };
    }

    try {
      // 1. Kiểm tra trùng lặp thuốc (Duplicate Medication Check)
      const drugMap = new Map<string, typeof meds>();
      for (const med of meds) {
        const key = (med.matchedDrugId || med.normalizedName).toLowerCase().trim();
        if (!drugMap.has(key)) {
          drugMap.set(key, []);
        }
        drugMap.get(key)!.push(med);
      }

      drugMap.forEach((items) => {
        if (items.length > 1) {
          const drugDisplay = items[0].matchedDrugName || items[0].rawName;
          findings.push({
            ruleId: this.id,
            findingType: "DUPLICATE_MEDICATION",
            severity: "WARNING",
            title: `Phát hiện chỉ định thuốc trùng lặp: ${drugDisplay}`,
            description: `Thuốc '${drugDisplay}' xuất hiện ${items.length} lần trong cùng một đơn thuốc.`,
            clinicalExplanation:
              "Việc kê trùng một tên thuốc trong đơn có thể khiến người bệnh uống trùng lặp dẫn đến nguy cơ quá liều.",
            recommendationText: "Cần được dược sĩ/bác sĩ kiểm tra để xác nhận có phải kê thêm liều hay bị nhầm lẫn dòng chỉ định.",
            medicationIds: items.map((m: any) => m.id),
            drugNames: items.map((m: any) => m.matchedDrugName || m.rawName),
            sourceId: "DUPLICATE_DRUG_CHECK_V1",
            sourceName: DEV_TEST_DATA_NOTICE,
            sourceVersion: "1.0.0-dev",
            ruleVersion: this.version,
          });
        }
      });

      // 2. Kiểm tra trùng lặp hoạt chất giữa các biệt dược khác nhau (Duplicate Active Ingredient)
      const checkedPairs = new Set<string>();

      for (let i = 0; i < meds.length; i++) {
        for (let j = i + 1; j < meds.length; j++) {
          const medA = meds[i];
          const medB = meds[j];

          // Bỏ qua nếu đã là cùng 1 thuốc (đã bắt ở mục 1)
          const keyA = (medA.matchedDrugId || medA.normalizedName).toLowerCase().trim();
          const keyB = (medB.matchedDrugId || medB.normalizedName).toLowerCase().trim();
          if (keyA === keyB) {
            continue;
          }

          const pairId = [medA.id, medB.id].sort().join(":::");
          if (checkedPairs.has(pairId)) {
            continue;
          }
          checkedPairs.add(pairId);

          const ingA = (medA.activeIngredient || medA.genericName || "").toLowerCase();
          const ingB = (medB.activeIngredient || medB.genericName || "").toLowerCase();

          // Danh sách hoạt chất chính cần kiểm tra trùng lặp
          const commonIngredients = [
            "paracetamol",
            "acetaminophen",
            "ibuprofen",
            "amoxicillin",
            "aspirin",
            "omeprazol",
            "azithromycin",
          ];

          for (const ingredient of commonIngredients) {
            if (ingA.includes(ingredient) && ingB.includes(ingredient)) {
              const nameA = medA.matchedDrugName || medA.rawName;
              const nameB = medB.matchedDrugName || medB.rawName;

              findings.push({
                ruleId: this.id,
                findingType: "DUPLICATE_ACTIVE_INGREDIENT",
                severity: "HIGH",
                title: `Có khả năng trùng lặp hoạt chất (${ingredient.toUpperCase()}): ${nameA} & ${nameB}`,
                description: `Hai biệt dược khác nhau (${nameA} và ${nameB}) cùng chứa hoạt chất '${ingredient}'.`,
                clinicalExplanation:
                  "Sử dụng đồng thời nhiều chế phẩm có cùng hoạt chất có thể vô tình làm tăng gấp đôi tổng liều hàng ngày, gây độc tính mà người bệnh không hay biết.",
                recommendationText: "Cần được dược sĩ/bác sĩ đánh giá để tránh quá liều tích lũy.",
                medicationIds: [medA.id, medB.id],
                drugNames: [nameA, nameB],
                sourceId: "DUPLICATE_INGREDIENT_CHECK_V1",
                sourceName: DEV_TEST_DATA_NOTICE,
                sourceVersion: "1.0.0-dev",
                ruleVersion: this.version,
              });
              break;
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
        message: err?.message || "Lỗi kiểm tra trùng lặp thuốc.",
      };
    }
  }
}
