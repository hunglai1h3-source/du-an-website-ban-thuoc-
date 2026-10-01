import { PrescriptionError } from "../errors";

/**
 * ExtractionError
 * Lớp lỗi cơ sở cho giai đoạn bóc tách dữ liệu AI
 */
export class ExtractionError extends PrescriptionError {
  constructor(
    message: string,
    httpStatus: number = 500,
    code: string = "EXTRACTION_INTERNAL_ERROR"
  ) {
    super(message, httpStatus, code as any);
    this.name = "ExtractionError";
  }
}

export class OcrNotCompletedError extends ExtractionError {
  constructor(
    message: string = "Đơn thuốc chưa hoàn tất tiến trình bóc tách OCR. Vui lòng hoàn thành bước OCR trước khi phân tích AI."
  ) {
    super(message, 400, "OCR_NOT_COMPLETED");
    this.name = "OcrNotCompletedError";
  }
}

export class ExtractionAlreadyProcessingError extends ExtractionError {
  constructor(
    message: string = "Hệ thống đang phân tích đơn thuốc. Vui lòng không gửi yêu cầu trùng lặp."
  ) {
    super(message, 409, "EXTRACTION_ALREADY_PROCESSING");
    this.name = "ExtractionAlreadyProcessingError";
  }
}

export class AiOutputInvalidError extends ExtractionError {
  constructor(
    message: string = "Dữ liệu trả về từ mô hình AI không đúng cấu trúc schema y tế quy định."
  ) {
    super(message, 422, "AI_OUTPUT_INVALID");
    this.name = "AiOutputInvalidError";
  }
}

export class AiTimeoutError extends ExtractionError {
  constructor(
    message: string = "Quá thời gian phản hồi từ dịch vụ AI (AI Timeout). Vui lòng thử lại sau."
  ) {
    super(message, 504, "AI_TIMEOUT");
    this.name = "AiTimeoutError";
  }
}

export class AiRateLimitedError extends ExtractionError {
  constructor(
    message: string = "Dịch vụ AI đang bị giới hạn tần suất (Rate limit). Vui lòng thử lại sau giây lát."
  ) {
    super(message, 429, "AI_RATE_LIMITED");
    this.name = "AiRateLimitedError";
  }
}

export class OcrTextTooLargeError extends ExtractionError {
  constructor(
    message: string = "Văn bản đơn thuốc vượt quá dung lượng xử lý an toàn của hệ thống."
  ) {
    super(message, 413, "OCR_TEXT_TOO_LARGE");
    this.name = "OcrTextTooLargeError";
  }
}

export class MedicationNotFoundError extends ExtractionError {
  constructor(
    message: string = "Không tìm thấy thông tin thuốc theo mã định danh cung cấp."
  ) {
    super(message, 404, "MEDICATION_NOT_FOUND");
    this.name = "MedicationNotFoundError";
  }
}
