/**
 * H4CARE Pharmacy - Prescription Safety Engine Types
 * Phase 5: Deterministic Safety Engine & Clinical Rule Evaluation
 */

export type SafetySeverity = "CRITICAL" | "HIGH" | "WARNING" | "CAUTION" | "INFO";

export type SafetyFindingType =
  | "ALLERGY"
  | "DRUG_INTERACTION"
  | "DOSAGE_LIMIT"
  | "STRUCTURAL_DOSAGE"
  | "DUPLICATE_MEDICATION"
  | "DUPLICATE_ACTIVE_INGREDIENT"
  | "INSUFFICIENT_DATA"
  | "UNRESOLVED_MEDICATION";

export type SafetyReportStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "NEEDS_REVIEW"
  | "INCOMPLETE"
  | "FAILED"
  | "STALE";

export type RuleCheckStatus =
  | "COMPLETED"
  | "INSUFFICIENT_DATA"
  | "FAILED"
  | "SKIPPED";

export const DEV_TEST_DATA_NOTICE = "DEVELOPMENT / TEST DATA ONLY";

export interface SafetyFindingData {
  id?: string;
  ruleId: string;
  findingType: SafetyFindingType;
  severity: SafetySeverity;
  title: string;
  description: string;
  clinicalExplanation?: string | null;
  recommendationText?: string | null;
  medicationIds: string[];
  drugNames: string[];
  sourceId: string;
  sourceName: string;
  sourceVersion: string;
  ruleVersion: string;
}

export interface SafetyRuleExecutionResult {
  ruleId: string;
  ruleName: string;
  ruleVersion: string;
  status: RuleCheckStatus;
  findings: SafetyFindingData[];
  durationMs: number;
  message?: string;
}

export interface SafetyReportSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  warningCount: number;
  cautionCount: number;
  infoCount: number;
}

export interface SafetyReportData {
  id: string;
  prescriptionId: string;
  extractionId: string;
  status: SafetyReportStatus;
  isStale: boolean;
  summary: SafetyReportSummary;
  allergyCheckStatus: RuleCheckStatus;
  interactionCheckStatus: RuleCheckStatus;
  dosageCheckStatus: RuleCheckStatus;
  duplicateCheckStatus: RuleCheckStatus;
  hasUnresolvedMedications: boolean;
  summaryText: string;
  processingTimeMs: number | null;
  findings: SafetyFindingData[];
  ruleExecutions: Array<{
    ruleId: string;
    ruleName: string;
    ruleVersion: string;
    status: RuleCheckStatus;
    findingCount: number;
    durationMs: number | null;
    message?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationContextItem {
  id: string;
  rawName: string;
  normalizedName: string;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  route: string | null;
  instructions: string | null;
  matchStatus: "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED";
  matchedDrugId: string | null;
  matchedDrugName: string | null;
  activeIngredient?: string | null;
  genericName?: string | null;
  userConfirmedDrugId: string | null;
  userConfirmedName: string | null;
  reviewStatus: "PENDING_REVIEW" | "CONFIRMED" | "REJECTED_UNKNOWN";
}

export interface SafetyContext {
  prescriptionId: string;
  extractionId: string;
  extractionUpdatedAt: Date;
  patientAge: string | null;
  patientGender: string | null;
  medications: MedicationContextItem[];
  allergyProfile?: string[] | null; // Danh sách tác nhân dị ứng của người dùng (nếu có)
  unresolvedMedications: MedicationContextItem[];
  confirmedMedications: MedicationContextItem[];
}
