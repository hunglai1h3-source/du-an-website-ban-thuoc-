import { NextRequest, NextResponse } from "next/server";
import { extractionService } from "@/lib/prescription/extraction/extraction-service";
import { formatErrorResponse } from "@/lib/prescription/errors";
import { ExtractionApiSuccessResponse } from "@/lib/prescription/extraction/extraction-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/prescription/[id]/extract
 * Khởi chạy tiến trình bóc tách dữ liệu đơn thuốc có cấu trúc bằng AI (Phase 4)
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
      // Body rỗng được chấp nhận
    }

    const extractionData = await extractionService.runExtraction(id, { forceRetry });

    const successRes: ExtractionApiSuccessResponse = {
      success: true,
      extraction: extractionData,
      message: "Bóc tách thông tin đơn thuốc có cấu trúc thành công.",
    };

    return NextResponse.json(successRes, { status: 200 });
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * GET /api/prescription/[id]/extract
 * Lấy kết quả bóc tách dữ liệu đơn thuốc có cấu trúc của Phase 4
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const extractionData = await extractionService.getExtractionResult(id);

    const successRes: ExtractionApiSuccessResponse = {
      success: true,
      extraction: extractionData,
      message:
        extractionData.status === "COMPLETED" || extractionData.status === "NEEDS_REVIEW"
          ? "Đã có dữ liệu phân tích đơn thuốc có cấu trúc."
          : "Đang chờ hoặc đang xử lý phân tích.",
    };

    return NextResponse.json(successRes, { status: 200 });
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
