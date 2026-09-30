import { PrescriptionError } from "../errors";

export class OcrError extends PrescriptionError {
  constructor(
    message: string,
    httpStatus: number = 500,
    code: string = "OCR_INTERNAL_ERROR"
  ) {
    super(message, httpStatus, code as any);
    this.name = "OcrError";
  }
}

export class OcrNotFoundError extends OcrError {
  constructor(message: string = "Không tìm thấy kết quả OCR cho đơn thuốc này.") {
    super(message, 404, "OCR_RESULT_NOT_FOUND");
    this.name = "OcrNotFoundError";
  }
}

export class OcrAlreadyProcessingError extends OcrError {
  constructor(
    message: string = "Hệ thống đang trong quá trình bóc tách nội dung đơn thuốc. Vui lòng không gửi yêu cầu trùng lặp."
  ) {
    super(message, 409, "OCR_ALREADY_PROCESSING");
    this.name = "OcrAlreadyProcessingError";
  }
}

export class DocumentTooLargeError extends OcrError {
  constructor(message: string = "Tài liệu vượt quá giới hạn trang xử lý cho phép (tối đa 10 trang).") {
    super(message, 413, "PDF_PAGE_LIMIT_EXCEEDED");
    this.name = "DocumentTooLargeError";
  }
}

export class OcrTimeoutError extends OcrError {
  constructor(
    message: string = "Quá thời gian xử lý OCR cho phép (60 giây). Vui lòng thử lại với tài liệu dung lượng nhỏ hơn."
  ) {
    super(message, 504, "OCR_TIMEOUT");
    this.name = "OcrTimeoutError";
  }
}

export class OcrProviderError extends OcrError {
  constructor(message: string = "Đã xảy ra lỗi từ bộ máy nhận dạng quang học OCR.") {
    super(message, 502, "OCR_PROVIDER_FAILED");
    this.name = "OcrProviderError";
  }
}

export class CorruptDocumentError extends OcrError {
  constructor(
    message: string = "Tài liệu bị hỏng hoặc định dạng cấu trúc không thể giải mã để bóc tách nội dung."
  ) {
    super(message, 422, "CORRUPT_DOCUMENT");
    this.name = "CorruptDocumentError";
  }
}
