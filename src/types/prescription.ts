/**
 * H4CARE Pharmacy - Prescription Module Types
 * Phase 1: Upload Foundation
 */

export type PrescriptionStatus =
  | "idle"
  | "uploading"
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export type ValidationErrorCode =
  | "FILE_MISSING"
  | "FILE_EMPTY"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "INVALID_SIGNATURE";

export interface PrescriptionValidationResult {
  isValid: boolean;
  error?: string;
  code?: ValidationErrorCode;
  httpStatus?: number;
}

export interface PrescriptionUploadSuccessResponse {
  success: true;
  prescriptionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: PrescriptionStatus;
  message: string;
  uploadedAt: string;
}

export interface PrescriptionUploadErrorResponse {
  success: false;
  message: string;
  code?: ValidationErrorCode | "INTERNAL_SERVER_ERROR" | "NETWORK_ERROR";
}

export type PrescriptionUploadResponse =
  | PrescriptionUploadSuccessResponse
  | PrescriptionUploadErrorResponse;

export interface PrescriptionFile {
  file: File;
  previewUrl: string | null;
  id: string;
}
