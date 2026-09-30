import {
  SafetyContext,
  SafetyRuleExecutionResult,
  SafetyFindingData,
  SafetyReportSummary,
  SafetyReportStatus,
  RuleCheckStatus,
  DEV_TEST_DATA_NOTICE,
} from "./safety-types";
import { SafetyRule } from "./rules/safety-rule";
import { AllergyRule } from "./rules/allergy-rule";
import { InteractionRule } from "./rules/interaction-rule";
import { DosageRule } from "./rules/dosage-rule";
import { DuplicateRule } from "./rules/duplicate-rule";

/**
 * H4CARE Pharmacy - Safety Engine
 * Phase 5: Deterministic Safety Engine & Clinical Rule Orchestrator
 */

export interface SafetyEngineEvaluationResult {
  status: SafetyReportStatus;
  summary: SafetyReportSummary;
  allergyCheckStatus: RuleCheckStatus;
  interactionCheckStatus: RuleCheckStatus;
  dosageCheckStatus: RuleCheckStatus;
  duplicateCheckStatus: RuleCheckStatus;
  hasUnresolvedMedications: boolean;
  summaryText: string;
  findings: SafetyFindingData[];
  ruleExecutions: SafetyRuleExecutionResult[];
}

export class SafetyEngine {
  private rules: SafetyRule[] = [];

  constructor(customRules?: SafetyRule[]) {
    if (customRules) {
      this.rules = customRules;
    } else {
      this.rules = [
        new AllergyRule(),
        new InteractionRule(),
        new DosageRule(),
        new DuplicateRule(),
      ];
    }
  }

  public async evaluate(context: SafetyContext): Promise<SafetyEngineEvaluationResult> {
    const allFindings: SafetyFindingData[] = [];
    const ruleExecutions: SafetyRuleExecutionResult[] = [];

    let allergyCheckStatus: RuleCheckStatus = "SKIPPED";
    let interactionCheckStatus: RuleCheckStatus = "SKIPPED";
    let dosageCheckStatus: RuleCheckStatus = "SKIPPED";
    let duplicateCheckStatus: RuleCheckStatus = "SKIPPED";

    // 1. Kiểm tra thuốc chưa rõ ràng (Unresolved Medications Policy)
    // Nếu có thuốc UNMATCHED hoặc unconfirmed NEEDS_REVIEW:
    // Tuyệt đối không giả vờ đã biết chính xác để chạy an toàn lâm sàng
    const hasUnresolvedMedications = context.unresolvedMedications.length > 0;
    if (hasUnresolvedMedications) {
      allFindings.push({
        ruleId: "SAFETY_SYSTEM_GUARD",
        findingType: "UNRESOLVED_MEDICATION",
        severity: "WARNING",
        title: "Đơn thuốc có thuốc chưa được xác nhận danh mục",
        description: `Có ${context.unresolvedMedications.length} dòng thuốc chưa được đối soát chính thức (${context.unresolvedMedications.map((m) => m.rawName).join(", ")}). Các quy tắc an toàn lâm sàng (tương tác, liều tối đa) sẽ chỉ được đánh giá trên các thuốc đã xác nhận.`,
        clinicalExplanation: "Thuốc chưa xác định không thể đối chiếu chính xác hoạt chất và nguy cơ tương tác.",
        recommendationText: "Vui lòng xem lại và xác nhận danh mục thuốc ở bước trước để hoàn tất kiểm tra an toàn toàn diện.",
        medicationIds: context.unresolvedMedications.map((m) => m.id),
        drugNames: context.unresolvedMedications.map((m) => m.rawName),
        sourceId: "SYSTEM_UNRESOLVED_GUARD",
        sourceName: DEV_TEST_DATA_NOTICE,
        sourceVersion: "1.0.0-dev",
        ruleVersion: "1.0.0",
      });
    }

    // 2. Chạy từng quy tắc độc lập (Rule Execution Isolation)
    // Nếu 1 quy tắc gặp lỗi hoặc thiếu nguồn, các quy tắc khác vẫn tiếp tục chạy độc lập
    for (const rule of this.rules) {
      try {
        const result = await rule.evaluate(context);
        ruleExecutions.push(result);
        allFindings.push(...result.findings);

        if (rule.id === "RULE_ALLERGY") allergyCheckStatus = result.status;
        if (rule.id === "RULE_INTERACTION") interactionCheckStatus = result.status;
        if (rule.id === "RULE_DOSAGE") dosageCheckStatus = result.status;
        if (rule.id === "RULE_DUPLICATE") duplicateCheckStatus = result.status;
      } catch (err: any) {
        const errorResult: SafetyRuleExecutionResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleVersion: rule.version,
          status: "FAILED",
          findings: [],
          durationMs: 0,
          message: err?.message || "Lỗi ngoại lệ không xác định khi thực thi quy tắc.",
        };
        ruleExecutions.push(errorResult);

        if (rule.id === "RULE_ALLERGY") allergyCheckStatus = "FAILED";
        if (rule.id === "RULE_INTERACTION") interactionCheckStatus = "FAILED";
        if (rule.id === "RULE_DOSAGE") dosageCheckStatus = "FAILED";
        if (rule.id === "RULE_DUPLICATE") duplicateCheckStatus = "FAILED";
      }
    }

    // 3. Sắp xếp thứ tự ưu tiên của các cảnh báo (Priority Sorting)
    // CRITICAL > HIGH > WARNING > CAUTION > INFO
    const severityWeights: Record<string, number> = {
      CRITICAL: 5,
      HIGH: 4,
      WARNING: 3,
      CAUTION: 2,
      INFO: 1,
    };

    allFindings.sort((a, b) => {
      const weightA = severityWeights[a.severity] || 0;
      const weightB = severityWeights[b.severity] || 0;
      return weightB - weightA;
    });

    // 4. Tổng hợp bộ đếm thống kê
    let criticalCount = 0;
    let highCount = 0;
    let warningCount = 0;
    let cautionCount = 0;
    let infoCount = 0;

    for (const f of allFindings) {
      if (f.severity === "CRITICAL") criticalCount++;
      else if (f.severity === "HIGH") highCount++;
      else if (f.severity === "WARNING") warningCount++;
      else if (f.severity === "CAUTION") cautionCount++;
      else if (f.severity === "INFO") infoCount++;
    }

    const totalFindings = allFindings.length;
    const summary: SafetyReportSummary = {
      totalFindings,
      criticalCount,
      highCount,
      warningCount,
      cautionCount,
      infoCount,
    };

    // 5. Xác định trạng thái tổng thể của báo cáo an toàn (Report Status)
    // COMPLETED không có nghĩa là an toàn tuyệt đối, nó chỉ phản ánh engine đã chạy xong!
    let status: SafetyReportStatus = "COMPLETED";

    const isAllFailed = ruleExecutions.every((r) => r.status === "FAILED");
    const hasAnyIncomplete =
      hasUnresolvedMedications ||
      allergyCheckStatus === "INSUFFICIENT_DATA" ||
      allergyCheckStatus === "FAILED" ||
      interactionCheckStatus === "FAILED" ||
      dosageCheckStatus === "FAILED" ||
      duplicateCheckStatus === "FAILED";

    if (isAllFailed) {
      status = "FAILED";
    } else if (criticalCount > 0 || highCount > 0 || warningCount > 0) {
      status = "NEEDS_REVIEW";
    } else if (hasAnyIncomplete) {
      status = "INCOMPLETE";
    } else {
      status = "COMPLETED";
    }

    // 6. Xây dựng văn bản tóm tắt (Tuyệt đối không dùng từ "SAFE")
    let summaryText = "";
    if (totalFindings === 0) {
      summaryText = "Không phát hiện cảnh báo từ các quy tắc hiện có (NO_FINDINGS_DETECTED).";
    } else {
      const parts: string[] = [];
      if (criticalCount > 0) parts.push(`${criticalCount} cảnh báo nghiêm trọng`);
      if (highCount > 0) parts.push(`${highCount} mức độ cao`);
      if (warningCount > 0) parts.push(`${warningCount} cần lưu ý`);
      if (cautionCount > 0) parts.push(`${cautionCount} thận trọng`);
      if (infoCount > 0) parts.push(`${infoCount} thông tin`);

      summaryText = `Phát hiện ${totalFindings} điểm cần xem xét (${parts.join(", ")}).`;
    }

    return {
      status,
      summary,
      allergyCheckStatus,
      interactionCheckStatus,
      dosageCheckStatus,
      duplicateCheckStatus,
      hasUnresolvedMedications,
      summaryText,
      findings: allFindings,
      ruleExecutions,
    };
  }
}

export const defaultSafetyEngine = new SafetyEngine();
