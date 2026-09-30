import { PrescriptionError } from "@/lib/prescription/errors";

/**
 * H4CARE Pharmacy - Safety Engine Custom Errors
 * Phase 5: Deterministic Safety Engine & Clinical Rule Evaluation
 */

export class SafetyError extends PrescriptionError {
  constructor(message: string, httpStatus: number = 500, code: string = "SAFETY_ERROR") {
    super(message, httpStatus, code as any);
    this.name = "SafetyError";
  }
}

export class ExtractionNotReadyError extends SafetyError {
  constructor(message: string = "Đơn thuốc chưa hoàn tất trích xuất cấu trúc AI để kiểm tra an toàn.") {
    super(message, 422, "EXTRACTION_NOT_READY");
  }
}

export class SafetyAlreadyProcessingError extends SafetyError {
  constructor(message: string = "Tiến trình kiểm tra an toàn đang được thực hiện. Vui lòng chờ hoàn tất.") {
    super(message, 409, "SAFETY_ALREADY_PROCESSING");
  }
}

export class SafetyReportNotFoundError extends SafetyError {
  constructor(message: string = "Không tìm thấy báo cáo kiểm tra an toàn của đơn thuốc.") {
    super(message, 404, "SAFETY_REPORT_NOT_FOUND");
  }
}

export class SafetyReportStaleError extends SafetyError {
  constructor(message: string = "Báo cáo an toàn hiện tại đã lỗi thời do thông tin thuốc đã bị thay đổi.") {
    super(message, 409, "SAFETY_REPORT_STALE");
  }
}

export class SafetyProviderUnavailableError extends SafetyError {
  constructor(message: string = "Nguồn dữ liệu tham chiếu an toàn tạm thời không khả dụng.") {
    super(message, 503, "SAFETY_DATA_UNAVAILABLE");
  }
}
