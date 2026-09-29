import { NextResponse } from "next/server";
import { ValidationErrorCode, PrescriptionUploadErrorResponse } from "@/types/prescription";

export class PrescriptionError extends Error {
  public httpStatus: number;
  public code: ValidationErrorCode | "INTERNAL_SERVER_ERROR";

  constructor(
    message: string,
    httpStatus: number = 500,
    code: ValidationErrorCode | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR"
  ) {
    super(message);
    this.name = "PrescriptionError";
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export class ValidationError extends PrescriptionError {
  constructor(message: string, httpStatus: number = 400, code: ValidationErrorCode = "UNSUPPORTED_TYPE") {
    super(message, httpStatus, code);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends PrescriptionError {
  constructor(message: string = "Không tìm thấy đơn thuốc theo mã định danh cung cấp.") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class StorageError extends PrescriptionError {
  constructor(message: string = "Không thể ghi tệp vào hệ thống lưu trữ an toàn.") {
    super(message, 500, "STORAGE_ERROR");
    this.name = "StorageError";
  }
}

export class DatabaseError extends PrescriptionError {
  constructor(message: string = "Không thể ghi nhận dữ liệu đơn thuốc vào cơ sở dữ liệu.") {
    super(message, 500, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

/**
 * Xử lý lỗi API thống nhất, không để lộ server stack trace cho client
 */
export function formatErrorResponse(error: unknown): {
  response: PrescriptionUploadErrorResponse;
  status: number;
} {
  if (error instanceof PrescriptionError) {
    return {
      response: {
        success: false,
        message: error.message,
        code: error.code,
      },
      status: error.httpStatus,
    };
  }

  // Lỗi không lường trước (Internal system error)
  return {
    response: {
      success: false,
      message: "Đã xảy ra sự cố nội bộ trong quá trình xử lý đơn thuốc. Vui lòng thử lại sau.",
      code: "INTERNAL_SERVER_ERROR",
    },
    status: 500,
  };
}
