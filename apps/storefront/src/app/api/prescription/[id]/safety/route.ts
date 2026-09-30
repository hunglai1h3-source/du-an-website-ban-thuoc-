import { NextRequest, NextResponse } from "next/server";
import { safetyService } from "@/lib/prescription/safety/safety-service";
import { formatErrorResponse } from "@/lib/prescription/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/prescription/[id]/safety
 * Khởi chạy tiến trình kiểm tra an toàn toàn diện (Safety Engine) cho đơn thuốc
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body rỗng được chấp nhận
    }

    const forceRerun = Boolean(body?.forceRerun);
    const allergyProfile = Array.isArray(body?.allergyProfile)
      ? body.allergyProfile
      : undefined;

    const safetyReport = await safetyService.runSafetyCheck(id, {
      forceRerun,
      allergyProfile,
    });

    return NextResponse.json(
      {
        success: true,
        report: safetyReport,
        message: "Kiểm tra an toàn đơn thuốc hoàn tất.",
      },
      { status: 200 }
    );
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * GET /api/prescription/[id]/safety
 * Lấy báo cáo an toàn hiện tại của đơn thuốc
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const safetyReport = await safetyService.getSafetyReport(id);

    return NextResponse.json(
      {
        success: true,
        report: safetyReport,
      },
      { status: 200 }
    );
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
