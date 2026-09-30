from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Order, PaymentTransaction
from app.services.momo_service import MomoPaymentService

payments_router = APIRouter(prefix="/payments", tags=["Cổng thanh toán Trực tuyến"])


# ==============================================================================
# SCHEMAS
# ==============================================================================

class CreateMomoPaymentRequest(BaseModel):
    order_code: str = Field(..., min_length=5, max_length=50)
    return_url: Optional[str] = None


class SimulatePaymentRequest(BaseModel):
    order_code: str = Field(..., min_length=5, max_length=50)
    success: bool = True


# ==============================================================================
# ENDPOINTS
# ==============================================================================

@payments_router.post("/momo/create")
def create_momo_payment(
    payload: CreateMomoPaymentRequest,
    db: Session = Depends(get_db),
):
    """
    Khởi tạo yêu cầu thanh toán MoMo Sandbox cho đơn hàng.
    Trả về payUrl và qrCodeUrl để người mua quét mã thanh toán.
    """
    order = db.scalar(select(Order).where(Order.order_code == payload.order_code.strip()))
    if not order:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn hàng '{payload.order_code}'")

    if order.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Đơn hàng này đã được thanh toán thành công trước đó.")

    res = MomoPaymentService.create_payment_request(
        db=db,
        order=order,
        return_url=payload.return_url,
    )
    return res


@payments_router.post("/momo/webhook")
async def momo_ipn_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Endpoint tiếp nhận thông báo tức thì (IPN Webhook) từ Cổng thanh toán MoMo.
    Kiểm tra chữ ký số HMAC-SHA256, tự động cập nhật trạng thái đơn sang ĐÃ THANH TOÁN (PAID) và gửi cảnh báo.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload không đúng định dạng JSON.")

    result = MomoPaymentService.process_ipn_callback(db=db, payload=payload)
    return result


@payments_router.post("/momo/simulate")
def simulate_momo_payment(
    payload: SimulatePaymentRequest,
    db: Session = Depends(get_db),
):
    """
    [MÔI TRƯỜNG DEV/DEMO] Mô phỏng quét mã thanh toán MoMo thành công trực tiếp trên máy chủ cục bộ
    mà không cần thông qua mạng công cộng.
    """
    return MomoPaymentService.simulate_payment(
        db=db,
        order_code=payload.order_code.strip(),
        success=payload.success,
    )


@payments_router.get("/orders/{order_code}/status")
def get_order_payment_status(
    order_code: str,
    db: Session = Depends(get_db),
):
    """
    Kiểm tra trạng thái thanh toán hiện tại của đơn hàng.
    """
    order = db.scalar(select(Order).where(Order.order_code == order_code.strip()))
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    transactions = db.scalars(
        select(PaymentTransaction)
        .where(PaymentTransaction.order_id == order.id)
        .order_by(desc(PaymentTransaction.id))
    ).all()

    return {
        "order_code": order.order_code,
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
        "total_amount": float(order.total_amount),
        "order_status": order.order_status,
        "transactions": [
            {
                "id": t.id,
                "transaction_code": t.transaction_code,
                "provider": t.provider,
                "amount": float(t.amount),
                "status": t.status,
                "provider_trans_id": t.provider_trans_id,
                "provider_pay_url": t.provider_pay_url,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            }
            for t in transactions
        ],
    }
