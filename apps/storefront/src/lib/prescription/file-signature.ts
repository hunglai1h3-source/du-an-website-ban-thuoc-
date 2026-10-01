import { PrescriptionValidationResult } from "@/types/prescription";

export const FILE_SIGNATURES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
} as const;

/**
 * Phát hiện loại file thực tế dựa trên Magic Bytes ở đầu buffer.
 */
export function detectActualFileType(
  buffer: ArrayBuffer | Uint8Array
): { type: "JPEG" | "PNG" | "PDF"; mimeType: string; extension: string } | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length < 4) {
    return null;
  }

  // Check JPEG (FF D8 FF)
  if (
    bytes[0] === FILE_SIGNATURES.JPEG[0] &&
    bytes[1] === FILE_SIGNATURES.JPEG[1] &&
    bytes[2] === FILE_SIGNATURES.JPEG[2]
  ) {
    return { type: "JPEG", mimeType: "image/jpeg", extension: ".jpg" };
  }

  // Check PNG (89 50 4E 47 ...)
  if (
    bytes.length >= 8 &&
    bytes[0] === FILE_SIGNATURES.PNG[0] &&
    bytes[1] === FILE_SIGNATURES.PNG[1] &&
    bytes[2] === FILE_SIGNATURES.PNG[2] &&
    bytes[3] === FILE_SIGNATURES.PNG[3] &&
    bytes[4] === FILE_SIGNATURES.PNG[4] &&
    bytes[5] === FILE_SIGNATURES.PNG[5] &&
    bytes[6] === FILE_SIGNATURES.PNG[6] &&
    bytes[7] === FILE_SIGNATURES.PNG[7]
  ) {
    return { type: "PNG", mimeType: "image/png", extension: ".png" };
  }

  // Check PDF (%PDF -> 25 50 44 46)
  if (
    bytes[0] === FILE_SIGNATURES.PDF[0] &&
    bytes[1] === FILE_SIGNATURES.PDF[1] &&
    bytes[2] === FILE_SIGNATURES.PDF[2] &&
    bytes[3] === FILE_SIGNATURES.PDF[3]
  ) {
    return { type: "PDF", mimeType: "application/pdf", extension: ".pdf" };
  }

  return null;
}

/**
 * Kiểm định toàn diện 3 chiều:
 * 1. Phần mở rộng file (Extension)
 * 2. Khai báo MIME Type (Declared MIME)
 * 3. Chữ ký nhị phân thực tế (Actual File Signature / Magic Bytes)
 */
export function verifyFileSignature(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string,
  declaredMimeType: string
): PrescriptionValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length < 4) {
    return {
      isValid: false,
      error: "Tệp tin bị hỏng hoặc kích thước quá nhỏ để xác thực tính toàn vẹn y tế.",
      code: "INVALID_SIGNATURE",
      httpStatus: 422,
    };
  }

  const detected = detectActualFileType(bytes);

  if (!detected) {
    return {
      isValid: false,
      error: "Nội dung tệp không khớp với chữ ký nhị phân hợp lệ của JPEG, PNG hoặc PDF.",
      code: "INVALID_SIGNATURE",
      httpStatus: 422,
    };
  }

  const cleanName = fileName.toLowerCase().trim();
  const hasValidExt =
    (detected.type === "JPEG" && (cleanName.endsWith(".jpg") || cleanName.endsWith(".jpeg"))) ||
    (detected.type === "PNG" && cleanName.endsWith(".png")) ||
    (detected.type === "PDF" && cleanName.endsWith(".pdf"));

  if (!hasValidExt) {
    return {
      isValid: false,
      error: `Phát hiện giả mạo phần mở rộng: Nội dung tệp thực tế là ${detected.type} nhưng tên file được khai báo là "${fileName}".`,
      code: "INVALID_SIGNATURE",
      httpStatus: 422,
    };
  }

  // Nếu client gửi MIME type, kiểm tra xem có khớp với detected MIME không
  if (declaredMimeType) {
    const normDeclared = declaredMimeType.toLowerCase().trim();
    const isMimeMatch =
      (detected.type === "JPEG" && (normDeclared === "image/jpeg" || normDeclared === "image/jpg")) ||
      (detected.type === "PNG" && normDeclared === "image/png") ||
      (detected.type === "PDF" && normDeclared === "application/pdf");

    if (!isMimeMatch) {
      return {
        isValid: false,
        error: `Phát hiện MIME spoofing: Tệp thực tế là ${detected.type} nhưng client khai báo MIME type là "${declaredMimeType}".`,
        code: "INVALID_SIGNATURE",
        httpStatus: 422,
      };
    }
  }

  return { isValid: true };
}
