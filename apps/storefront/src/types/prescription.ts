/**
 * H4CARE Pharmacy - Prescription Module Types
 * Phase 2: Prescription Storage + Database
 */

export type PrescriptionStatus =
  | "idle"
  | "uploading"
  | "uploaded"
  | "STORED"
  | "stored"
  | "PROCESSING"
  | "NEEDS_REVIEW"
  | "COMPLETED"
  | "FAILED"
  | "failed";

export type ValidationErrorCode =
  | "FILE_MISSING"
  | "FILE_EMPTY"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "INVALID_SIGNATURE"
  | "PATH_TRAVERSAL_DETECTED"
  | "STORAGE_ERROR"
  | "DATABASE_ERROR"
  | "INVALID_ID"
  | "NOT_FOUND";

export interface PrescriptionValidationResult {
  isValid: boolean;
  error?: string;
  code?: ValidationErrorCode;
  httpStatus?: number;
}

export interface PrescriptionMetadata {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PrescriptionUploadSuccessResponse {
  success: true;
  prescriptionId: string;
  status: "STORED" | "uploaded";
  file: {
    name: string;
    type: string;
    size: number;
  };
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

export interface PrescriptionGetSuccessResponse {
  success: true;
  prescription: PrescriptionMetadata;
}

export interface PrescriptionGetErrorResponse {
  success: false;
  message: string;
  code?: ValidationErrorCode | "INTERNAL_SERVER_ERROR";
}

export type PrescriptionGetResponse =
  | PrescriptionGetSuccessResponse
  | PrescriptionGetErrorResponse;

export interface PrescriptionFile {
  file: File;
  previewUrl: string | null;
  id: string;
}

export interface PrescriptionRecord {
  id: string;
  userId: string | null;
  sessionId: string | null;
  originalFileName: string;
  storedFileName: string;
  storageKey: string;
  filePath: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
