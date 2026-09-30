/**
 * H4CARE Pharmacy - Prescription OCR Types
 * Phase 3: Document Processing + OCR Pipeline
 */

export type OcrStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export const MAX_PDF_PAGES = 10;
export const OCR_TIMEOUT_MS = 60000; // 60 giây
export const MAX_RETRY_ATTEMPTS = 3;
export const OCR_LOW_CONFIDENCE_THRESHOLD = 0.6; // Dưới 60% đánh dấu cần dược sĩ kiểm tra kỹ

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number | null; // 0.0 - 1.0, null nếu provider không hỗ trợ
}

export interface OcrExecutionResult {
  provider: string;
  status: OcrStatus;
  fullText: string;
  pageCount: number;
  averageConfidence: number | null;
  pages: OcrPageResult[];
  processingTimeMs: number;
  errorMessage?: string;
  errorCode?: string;
}

export interface OcrApiResponseData {
  id?: string;
  prescriptionId: string;
  status: OcrStatus;
  provider?: string;
  pageCount?: number;
  averageConfidence?: number | null;
  pages?: OcrPageResult[];
  fullText?: string;
  attemptCount?: number;
  processingTimeMs?: number;
  isLowConfidence?: boolean;
  errorMessage?: string;
  errorCode?: string;
  completedAt?: string;
}

export interface OcrApiSuccessResponse {
  success: true;
  ocr: OcrApiResponseData;
  message: string;
}

export interface OcrApiErrorResponse {
  success: false;
  message: string;
  code: string;
  prescriptionId?: string;
}

export type OcrApiResponse = OcrApiSuccessResponse | OcrApiErrorResponse;
