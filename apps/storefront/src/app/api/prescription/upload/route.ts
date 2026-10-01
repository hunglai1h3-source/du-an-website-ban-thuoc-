import { NextRequest, NextResponse } from "next/server";
import { prescriptionService } from "@/lib/prescription/prescription-service";
import { formatErrorResponse } from "@/lib/prescription/errors";

export const dynamic = "force-dynamic";

/**
 * API Endpoint Tải lên & Lưu trữ Đơn thuốc (Phase 2)
 * POST /api/prescription/upload
 * Nhận: multipart/form-data với field "file"
 */
export async function POST(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu yêu cầu không đúng định dạng multipart/form-data.",
          code: "UNSUPPORTED_TYPE",
        },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const sessionId = (formData.get("sessionId") as string | null) || undefined;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Yêu cầu tải lên thiếu trường 'file' chứa đơn thuốc.",
          code: "FILE_MISSING",
        },
        { status: 400 }
      );
    }

    // Gọi Prescription Service để thực hiện validation, storage và DB record
    const result = await prescriptionService.createPrescription(file, {
      sessionId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
