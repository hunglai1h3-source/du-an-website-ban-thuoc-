import { z } from "zod";

/**
 * H4CARE Pharmacy - Prescription AI Structured Extraction Types
 * Phase 4: AI Structured Extraction + Drug Normalization
 */

export type ExtractionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "NEEDS_REVIEW"
  | "FAILED";

export type DrugMatchStatus = "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED";

export type MedicationReviewStatus =
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "REJECTED_UNKNOWN";

export const MAX_OCR_TEXT_LENGTH = 15000;
export const DEFAULT_AI_TIMEOUT_MS = 30000;
export const MAX_EXTRACTION_RETRY_ATTEMPTS = 3;
export const DRUG_MATCH_HIGH_CONFIDENCE_THRESHOLD = 0.88;
export const DRUG_MATCH_MIN_CANDIDATE_THRESHOLD = 0.5;

// =======================================================
// ZOD VALIDATION SCHEMAS FOR AI OUTPUT
// =======================================================

export const RawExtractedMedicationSchema = z.object({
  rawName: z.string().min(1, "rawName không được để trống"),
  strength: z.string().nullable().optional().default(null),
  dosage: z.string().nullable().optional().default(null),
  frequency: z.string().nullable().optional().default(null),
  duration: z.string().nullable().optional().default(null),
  quantity: z.string().nullable().optional().default(null),
  route: z.string().nullable().optional().default(null),
  instructions: z.string().nullable().optional().default(null),
  sourcePage: z.number().int().positive().nullable().optional().default(null),
  sourceText: z.string().nullable().optional().default(null),
});

export const RawAiExtractionOutputSchema = z.object({
  patientName: z.string().nullable().optional().default(null),
  patientAge: z.string().nullable().optional().default(null),
  patientGender: z.string().nullable().optional().default(null),
  doctorName: z.string().nullable().optional().default(null),
  diagnosis: z.string().nullable().optional().default(null),
  medications: z.array(RawExtractedMedicationSchema).default([]),
});

export type RawExtractedMedication = z.infer<typeof RawExtractedMedicationSchema>;
export type RawAiExtractionOutput = z.infer<typeof RawAiExtractionOutputSchema>;

// =======================================================
// DOMAIN & REPOSITORY TYPES
// =======================================================

export interface DrugCandidate {
  drugId: string;
  brandName: string;
  genericName: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  score: number; // 0.0 - 1.0 (thuật toán đo khoảng cách tương đồng)
  isExact: boolean;
}

export interface DrugMatchResult {
  matchStatus: DrugMatchStatus;
  bestMatch: DrugCandidate | null;
  candidates: DrugCandidate[]; // Top N ứng viên (ví dụ: tối đa 3)
}

export interface ExtractedMedicationData {
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
  sourcePage: number | null;
  sourceText: string | null;
  matchStatus: DrugMatchStatus;
  matchedDrugId: string | null;
  matchedDrugName: string | null;
  matchScore: number | null;
  candidates: DrugCandidate[];
  userConfirmedDrugId: string | null;
  userConfirmedName: string | null;
  reviewStatus: MedicationReviewStatus;
}

export interface ExtractionApiResponseData {
  id: string;
  prescriptionId: string;
  status: ExtractionStatus;
  provider: string;
  model: string;
  patientName: string | null;
  patientAge: string | null;
  patientGender: string | null;
  doctorName: string | null;
  diagnosis: string | null;
  medications: ExtractedMedicationData[];
  medicationCount: number;
  matchedCount: number;
  needsReviewCount: number;
  unmatchedCount: number;
  attemptCount: number;
  processingTimeMs: number | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  completedAt?: string | null;
}

export interface ExtractionApiSuccessResponse {
  success: true;
  extraction: ExtractionApiResponseData;
  message: string;
}

export interface ExtractionApiErrorResponse {
  success: false;
  message: string;
  code: string;
  prescriptionId?: string;
}

export type ExtractionApiResponse =
  | ExtractionApiSuccessResponse
  | ExtractionApiErrorResponse;
