import { NextRequest, NextResponse } from "next/server";
import { extractionService } from "@/lib/prescription/extraction/extraction-service";
import { formatErrorResponse } from "@/lib/prescription/errors";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/prescription/[id]/medications/[medicationId]
 * Người dùng hoặc Dược sĩ xác nhận hoặc chọn ứng viên thuốc (Human-in-the-loop Review)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; medicationId: string } }
) {
  try {
    const { id, medicationId } = params;
    const body = await request.json();

    const action = body?.action as "CONFIRM" | "CHOOSE_CANDIDATE" | "REJECT_UNKNOWN";
    if (!action || !["CONFIRM", "CHOOSE_CANDIDATE", "REJECT_UNKNOWN"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Tham số hành động (action) không hợp lệ. Cho phép: CONFIRM, CHOOSE_CANDIDATE, REJECT_UNKNOWN.",
          code: "INVALID_ACTION",
        },
        { status: 400 }
      );
    }

    const updatedMedication = await extractionService.confirmMedicationCandidate(
      id,
      medicationId,
      {
        action,
        candidateDrugId: body?.candidateDrugId,
      }
    );

    return NextResponse.json(
      {
        success: true,
        medication: updatedMedication,
        message: "Xác nhận thông tin thuốc thành công.",
      },
      { status: 200 }
    );
  } catch (error) {
    const { response, status } = formatErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
