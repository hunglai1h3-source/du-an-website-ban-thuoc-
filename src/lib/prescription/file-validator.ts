import {
  PrescriptionValidationResult,
  ValidationErrorCode,
} from "@/types/prescription";

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
 * Kiểm tra phần mở rộng file có hợp lệ hay không.
 */
export function isValidExtension(fileName: string): boolean {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extension);
}

/**
 * Lớp Validation 1: Kiểm tra siêu dữ liệu file (Metadata)
 * Áp dụng cho cả Client-side (trước khi gửi) và Server-side (khi vừa nhận Request).
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
  // Lưu ý: Trên một số trình duyệt/hệ điều hành, file.type đôi khi có thể bị trống nếu registry không có,
  // nhưng nếu có type thì phải thuộc danh sách cho phép.
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
 * Lớp Validation 2: Kiểm tra Magic Bytes (File Signature)
 * Áp dụng tại Backend nhằm ngăn chặn kẻ tấn công đổi đuôi file (ví dụ: đổi virus.exe thành donthuoc.jpg).
 */
export function validateFileMagicBytes(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string
): PrescriptionValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length < 4) {
    return {
      isValid: false,
      error: "Dữ liệu tệp bị hỏng hoặc kích thước quá nhỏ để xác thực.",
      code: "INVALID_SIGNATURE",
      httpStatus: 415,
    };
  }

  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  // Signature check:
  // JPEG / JPG: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;

  // PDF: 25 50 44 46 ('%' 'P' 'D' 'F')
  const isPdf =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;

  if (extension === ".jpg" || extension === ".jpeg") {
    if (!isJpeg) {
      return {
        isValid: false,
        error: "Chữ ký tệp (File Signature) không khớp với định dạng ảnh JPEG/JPG hợp lệ.",
        code: "INVALID_SIGNATURE",
        httpStatus: 415,
      };
    }
  } else if (extension === ".png") {
    if (!isPng) {
      return {
        isValid: false,
        error: "Chữ ký tệp (File Signature) không khớp với định dạng ảnh PNG hợp lệ.",
        code: "INVALID_SIGNATURE",
        httpStatus: 415,
      };
    }
  } else if (extension === ".pdf") {
    if (!isPdf) {
      return {
        isValid: false,
        error: "Chữ ký tệp (File Signature) không khớp với tài liệu chuẩn PDF.",
        code: "INVALID_SIGNATURE",
        httpStatus: 415,
      };
    }
  } else {
    return {
      isValid: false,
      error: "Định dạng tệp không được hỗ trợ bởi hệ thống phân tích đơn thuốc.",
      code: "UNSUPPORTED_TYPE",
      httpStatus: 415,
    };
  }

  return { isValid: true };
}
