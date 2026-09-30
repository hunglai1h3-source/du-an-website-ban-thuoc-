import {
  PrescriptionValidationResult,
  ValidationErrorCode,
} from "@/types/prescription";
import { verifyFileSignature } from "./file-signature";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"] as const;

/**
 * Định dạng dung lượng byte sang chuỗi hiển thị thân thiện (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Kiểm tra và làm sạch tên file người dùng tải lên, ngăn chặn triệt để Path Traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "unnamed_file";
  // Loại bỏ các ký tự điều khiển, null bytes, và path traversal indicators (../, ..\, etc.)
  const baseName = fileName.replace(/[\x00-\x1f\x80-\x9f]/g, "").trim();
  // Chỉ lấy tên file cuối cùng, bỏ qua mọi đường dẫn tương đối hoặc tuyệt đối
  const cleanName = baseName.split(/[/\\]/).pop() || "unnamed_file";
  return cleanName;
}

/**
 * Kiểm tra xem tên file có chứa dấu hiệu tấn công Path Traversal không
 */
export function hasPathTraversal(fileName: string): boolean {
  if (!fileName) return false;
  return (
    fileName.includes("..") ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName.includes("%00") ||
    fileName.includes("\0")
  );
}

/**
 * Kiểm tra phần mở rộng file có hợp lệ hay không.
 */
export function isValidExtension(fileName: string): boolean {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extension);
}

/**
 * Lớp Validation 1: Kiểm tra siêu dữ liệu file (Metadata)
 * Áp dụng cho cả Client-side (trước khi gửi) và Server-side.
 */
export function validateFileMetadata(file: {
  name?: string;
  size?: number;
  type?: string;
}): PrescriptionValidationResult {
  // 1. Kiểm tra file có tồn tại không
  if (!file) {
    return {
      isValid: false,
      error: "Vui lòng chọn hoặc tải lên một file đơn thuốc.",
      code: "FILE_MISSING",
      httpStatus: 400,
    };
  }

  const { name = "", size = 0, type = "" } = file;

  // 2. Kiểm tra file có rỗng không
  if (size === 0) {
    return {
      isValid: false,
      error: "File đơn thuốc tải lên có dung lượng rỗng (0 bytes). Vui lòng kiểm tra lại file của bạn.",
      code: "FILE_EMPTY",
      httpStatus: 400,
    };
  }

  // 3. Kiểm tra dung lượng tối đa (10 MB)
  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Dung lượng file vượt quá giới hạn cho phép (${formatFileSize(MAX_FILE_SIZE_BYTES)}). File hiện tại: ${formatFileSize(size)}.`,
      code: "FILE_TOO_LARGE",
      httpStatus: 413,
    };
  }

  // 4. Kiểm tra phần mở rộng file
  if (!isValidExtension(name)) {
    return {
      isValid: false,
      error: `Định dạng tệp "${name}" không được hỗ trợ. Hệ thống chỉ tiếp nhận JPG, JPEG, PNG hoặc PDF.`,
      code: "UNSUPPORTED_TYPE",
      httpStatus: 415,
    };
  }

  // 5. Kiểm tra MIME Type
  if (type && !(ALLOWED_MIME_TYPES as readonly string[]).includes(type)) {
    return {
      isValid: false,
      error: `Loại tệp "${type}" không hợp lệ. Vui lòng tải lên định dạng hình ảnh (JPEG, PNG) hoặc tài liệu PDF.`,
      code: "UNSUPPORTED_TYPE",
      httpStatus: 415,
    };
  }

  return { isValid: true };
}

/**
 * Lớp Validation 2: Tích hợp kiểm tra Magic Bytes toàn diện
 */
export function validateFileMagicBytes(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string,
  declaredMimeType: string = ""
): PrescriptionValidationResult {
  return verifyFileSignature(buffer, fileName, declaredMimeType);
}

/**
 * Hàm kiểm định tổng hợp (Master Validator) dành cho Server-side
 */
export function validatePrescriptionFile(
  file: { name: string; size: number; type: string },
  buffer: ArrayBuffer | Uint8Array
): PrescriptionValidationResult {
  // 1. Kiểm tra Metadata
  const metaResult = validateFileMetadata(file);
  if (!metaResult.isValid) {
    return metaResult;
  }

  // 2. Kiểm tra Magic Bytes
  const signatureResult = validateFileMagicBytes(buffer, file.name, file.type);
  if (!signatureResult.isValid) {
    return signatureResult;
  }

  return { isValid: true };
}
