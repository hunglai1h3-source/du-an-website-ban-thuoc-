import { NextRequest, NextResponse } from "next/server";
import { prescriptionService } from "@/lib/prescription/prescription-service";
import { formatErrorResponse } from "@/lib/prescription/errors";
import { PrescriptionGetSuccessResponse } from "@/types/prescription";

export const dynamic = "force-dynamic";

/**
 * API Endpoint Lấy Siêu Dữ Liệu Đơn Thuốc (Phase 2)
 * GET /api/prescription/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const prescription = await prescriptionService.getPrescriptionById(id);

    const successRes: PrescriptionGetSuccessResponse = {
      success: true,
      prescription,
    };

    return NextResponse.json(successRes, { status: 200 });
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
