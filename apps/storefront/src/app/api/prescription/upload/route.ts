import { NextRequest, NextResponse } from "next/server";
import {
  validateFileMetadata,
  validateFileMagicBytes,
} from "@/lib/prescription/file-validator";
import {
  PrescriptionUploadErrorResponse,
  PrescriptionUploadSuccessResponse,
} from "@/types/prescription";

export const dynamic = "force-dynamic";

/**
 * Endpoint tiếp nhận tải lên đơn thuốc (Phase 1: Upload Foundation)
 * Phương thức: POST
 * Định dạng: multipart/form-data
 * Field bắt buộc: "file"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Phân tích multipart/form-data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      const errorRes: PrescriptionUploadErrorResponse = {
        success: false,
        message: "Dữ liệu gửi lên không đúng định dạng multipart/form-data.",
        code: "UNSUPPORTED_TYPE",
      };
      return NextResponse.json(errorRes, { status: 400 });
    }

    const file = formData.get("file");

    // 2. Kiểm tra sự tồn tại của file
    if (!file || !(file instanceof File)) {
      const errorRes: PrescriptionUploadErrorResponse = {
        success: false,
        message: "Yêu cầu tải lên thiếu trường 'file' chứa đơn thuốc.",
        code: "FILE_MISSING",
      };
      return NextResponse.json(errorRes, { status: 400 });
    }

    // 3. Lớp kiểm định 1: Kiểm tra siêu dữ liệu (Tên, Dung lượng, MIME)
    const metadataValidation = validateFileMetadata({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!metadataValidation.isValid) {
      const errorRes: PrescriptionUploadErrorResponse = {
        success: false,
        message: metadataValidation.error || "File không hợp lệ.",
        code: metadataValidation.code,
      };
      return NextResponse.json(errorRes, {
        status: metadataValidation.httpStatus || 400,
      });
    }

    // 4. Lớp kiểm định 2: Đọc Buffer và xác minh Magic Bytes (Chống giả mạo đuôi file)
    const arrayBuffer = await file.arrayBuffer();
    const magicBytesValidation = validateFileMagicBytes(
      arrayBuffer,
      file.name
    );

    if (!magicBytesValidation.isValid) {
      const errorRes: PrescriptionUploadErrorResponse = {
        success: false,
        message: magicBytesValidation.error || "Chữ ký file không hợp lệ.",
        code: magicBytesValidation.code,
      };
      return NextResponse.json(errorRes, {
        status: magicBytesValidation.httpStatus || 415,
      });
    }

    // 5. Chuẩn bị mã định danh đơn thuốc tạm thời cho Phase 1
    // (Ở Phase 2 sẽ tích hợp lưu trữ File Storage và ghi vào Database)
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 9);
    const prescriptionId = `rx_${timestamp}_${randomHex}`;

    const successRes: PrescriptionUploadSuccessResponse = {
      success: true,
      prescriptionId,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      status: "uploaded",
      message: "Tải lên đơn thuốc thành công. Hệ thống đã tiếp nhận dữ liệu an toàn.",
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(successRes, { status: 200 });
  } catch (error) {
    // Ghi log lỗi có cấu trúc ở server để phục vụ theo dõi (Logging Service)
    console.error("[Prescription Upload API Error]:", error);

    const errorRes: PrescriptionUploadErrorResponse = {
      success: false,
      message: "Đã xảy ra sự cố nội bộ trong quá trình xử lý đơn thuốc trên máy chủ. Vui lòng thử lại sau.",
      code: "INTERNAL_SERVER_ERROR",
    };
    return NextResponse.json(errorRes, { status: 500 });
  }
}
