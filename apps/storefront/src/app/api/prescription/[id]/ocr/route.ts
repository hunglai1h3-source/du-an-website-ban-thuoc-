import { NextRequest, NextResponse } from "next/server";
import { ocrService } from "@/lib/prescription/ocr/ocr-service";
import { formatErrorResponse } from "@/lib/prescription/errors";
import {
  OcrApiSuccessResponse,
} from "@/lib/prescription/ocr/ocr-types";

export const dynamic = "force-dynamic";

/**
 * API Khởi chạy bóc tách nội dung đơn thuốc (Phase 3)
 * POST /api/prescription/[id]/ocr
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    let forceRetry = false;
    try {
      const body = await request.json();
      forceRetry = Boolean(body?.forceRetry);
    } catch {
      // Body rỗng không bắt buộc
    }

    const ocrData = await ocrService.runOcr(id, { forceRetry });

    const successRes: OcrApiSuccessResponse = {
      success: true,
      ocr: ocrData,
      message: "Bóc tách nội dung văn bản đơn thuốc thành công.",
    };

    return NextResponse.json(successRes, { status: 200 });
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * API Lấy kết quả bóc tách OCR của đơn thuốc (Phase 3)
 * GET /api/prescription/[id]/ocr
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const ocrData = await ocrService.getOcrResult(id);

    const successRes: OcrApiSuccessResponse = {
      success: true,
      ocr: ocrData,
      message:
        ocrData.status === "COMPLETED"
          ? "Đã có kết quả nhận dạng văn bản đơn thuốc."
          : "Đang chờ hoặc đang xử lý bóc tách.",
    };

    return NextResponse.json(successRes, { status: 200 });
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
