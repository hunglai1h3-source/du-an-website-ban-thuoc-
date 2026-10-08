"""
apps/api/app/services/return_policy_service.py

Chính sách đổi trả dược phẩm H4CARE & Đánh giá điều kiện đổi trả theo quy chuẩn.
Tuân thủ Luật Dược Việt Nam và chính sách hậu mãi minh bạch:
- Thuốc kê đơn (Rx) và sản phẩm yêu cầu điều kiện bảo quản đặc biệt (chuỗi lạnh, vắc xin)
  chỉ được chấp nhận đổi trả khi có lỗi từ phía nhà thuốc (giao sai hàng, cận/quá hạn dùng, hư hại do vận chuyển).
- Thuốc không kê đơn (OTC), thực phẩm chức năng, thiết bị y tế: thời hạn đổi trả tiêu chuẩn 07 ngày kể từ khi giao hàng thành công.
- Tính toán chính xác số lượng còn lại có thể đổi trả (Remaining Returnable Quantity).
- Xác định trách nhiệm phí vận chuyển chiều thu hồi (Reverse Shipping Fee).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import CanonicalProduct, Order, OrderItem
from app.models.enums import RxOtcStatus
from app.models.inventory import OrderFulfillment
from app.models.returns import ReturnItem, ReturnRequest, ReturnStatus


RETURN_WINDOW_DAYS_DEFAULT = 7

# Các lý do đổi trả xuất phát từ lỗi của Nhà thuốc (Nhà thuốc chịu 100% phí thu hồi & hoàn đủ tiền)
MERCHANT_FAULT_REASONS = {
    "WRONG_ITEM",         # Giao sai sản phẩm / sai quy cách
    "DEFECTIVE",          # Hàng hỏng hóc, bể vỡ khi nhận
    "EXPIRED_DELIVERED",  # Hàng cận/quá hạn sử dụng khi giao
    "RECALLED",           # Sản phẩm có quyết định thu hồi từ Bộ Y Tế
    "COUNTERFEIT_DOUBT",  # Nghi vấn chất lượng cần kiểm nghiệm
}

# Các lý do từ phía Khách hàng (áp dụng cho hàng OTC chưa bóc seal, khách chịu phí ship)
CUSTOMER_REASONS = {
    "CHANGED_MIND",       # Đổi ý không có nhu cầu nữa (chỉ áp dụng hàng còn seal nguyên vẹn)
    "ORDERED_WRONG",      # Khách đặt nhầm sản phẩm
    "OTHER",              # Lý do khác
}


@dataclass
class ItemEligibilityResult:
    order_item_id: int
    product_id: int | None
    product_name: str
    purchased_quantity: int
    returned_quantity: int
    returnable_quantity: int
    is_rx: bool
    is_eligible: bool
    reason_code: str
    message: str


@dataclass
class OrderEligibilityResult:
    order_code: str
    order_status: str
    payment_status: str
    delivery_date: datetime | None
    days_since_delivery: int | None
    within_return_window: bool
    can_request_return: bool
    can_request_exchange: bool
    rejection_reason: str | None
    items: list[ItemEligibilityResult]
    free_return_shipping_reasons: list[str]


class ReturnPolicyService:
    """
    Service thẩm định chính sách & điều kiện đổi trả cho đơn hàng.
    """

    @classmethod
    def evaluate_order_eligibility(
        cls,
        db: Session,
        order: Order,
    ) -> OrderEligibilityResult:
        """
        Đánh giá toàn diện điều kiện đổi trả của đơn hàng.
        """
        # 1. Kiểm tra trạng thái đơn hàng: Phải là DELIVERED hoặc COMPLETED
        valid_order_statuses = {"DELIVERED", "COMPLETED"}
        is_order_status_valid = order.order_status in valid_order_statuses

        # Kiểm tra trạng thái giao hàng từ order_fulfillments nếu có
        fulfillments = db.scalars(
            select(OrderFulfillment).where(OrderFulfillment.order_id == order.id)
        ).all()

        delivered_date = None
        if fulfillments:
            delivered_dates = [f.delivered_at for f in fulfillments if f.delivered_at]
            if delivered_dates:
                delivered_date = max(delivered_dates)
            elif is_order_status_valid:
                # Nếu đơn đánh dấu DELIVERED nhưng fulfillment chưa lưu delivered_at
                delivered_date = order.updated_at or order.created_at
        elif is_order_status_valid:
            delivered_date = order.updated_at or order.created_at

        now = datetime.now(UTC)
        days_since_delivery = None
        within_return_window = False

        if delivered_date:
            # Đảm bảo timezone-aware UTC
            if delivered_date.tzinfo is None:
                delivered_date = delivered_date.replace(tzinfo=UTC)
            diff = now - delivered_date
            days_since_delivery = max(0, diff.days)
            within_return_window = days_since_delivery <= RETURN_WINDOW_DAYS_DEFAULT
        elif not is_order_status_valid:
            within_return_window = False

        # 2. Truy vấn số lượng đã yêu cầu đổi/trả trước đó cho từng item trong đơn (trừ các request CANCELLED/REJECTED)
        active_returns = db.scalars(
            select(ReturnRequest).where(
                ReturnRequest.order_id == order.id,
                ReturnRequest.status.notin_([ReturnStatus.CANCELLED.value, ReturnStatus.REJECTED.value]),
            )
        ).all()

        item_returned_quantities: dict[int, int] = {}
        for ret in active_returns:
            for ret_item in ret.items:
                item_returned_quantities[ret_item.order_item_id] = (
                    item_returned_quantities.get(ret_item.order_item_id, 0) + ret_item.requested_quantity
                )

        # 3. Đánh giá từng sản phẩm trong đơn
        items_result: list[ItemEligibilityResult] = []
        has_at_least_one_eligible_item = False

        for item in order.items:
            product = db.get(CanonicalProduct, item.product_id) if item.product_id else None
            is_rx = False
            if product and product.rx_otc_status == RxOtcStatus.PRESCRIPTION:
                is_rx = True

            already_returned = item_returned_quantities.get(item.id, 0)
            returnable_qty = max(0, item.quantity - already_returned)

            item_eligible = True
            item_reason = "OK"
            item_msg = "Sản phẩm đủ điều kiện yêu cầu đổi/trả."

            if returnable_qty <= 0:
                item_eligible = False
                item_reason = "ALREADY_RETURNED"
                item_msg = "Sản phẩm đã được yêu cầu đổi/trả toàn bộ số lượng."
            elif not is_order_status_valid:
                item_eligible = False
                item_reason = "ORDER_NOT_DELIVERED"
                item_msg = f"Đơn hàng đang ở trạng thái '{order.order_status}', chưa giao hàng thành công."
            elif not within_return_window:
                # Quá hạn 7 ngày: Chỉ chấp nhận nếu có khiếu nại lỗi từ nhà thuốc / hàng hỏng
                item_eligible = True  # Cho phép submit khiếu nại nhưng gắn cảnh báo quá hạn
                item_reason = "OVERDUE_WINDOW"
                item_msg = f"Đã quá {RETURN_WINDOW_DAYS_DEFAULT} ngày kể từ khi nhận hàng. Cần nhân viên thẩm định lý do đặc biệt."
            elif is_rx:
                # Thuốc Rx: Vẫn có thể đổi trả nhưng phải là lỗi nhà thuốc
                item_reason = "RX_WARNING"
                item_msg = "Thuốc kê đơn (Rx) theo quy định y tế chỉ áp dụng đổi trả khi nhà thuốc giao sai hoặc lỗi bao bì."

            if item_eligible and returnable_qty > 0:
                has_at_least_one_eligible_item = True

            items_result.append(
                ItemEligibilityResult(
                    order_item_id=item.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    purchased_quantity=item.quantity,
                    returned_quantity=already_returned,
                    returnable_quantity=returnable_qty,
                    is_rx=is_rx,
                    is_eligible=item_eligible and returnable_qty > 0,
                    reason_code=item_reason,
                    message=item_msg,
                )
            )

        overall_can_request = is_order_status_valid and has_at_least_one_eligible_item
        rejection_reason = None

        if not is_order_status_valid:
            rejection_reason = f"Đơn hàng chưa giao thành công (Trạng thái hiện tại: {order.order_status})."
        elif not has_at_least_one_eligible_item:
            rejection_reason = "Tất cả sản phẩm trong đơn đã được yêu cầu đổi trả hoặc số lượng khả dụng bằng 0."

        return OrderEligibilityResult(
            order_code=order.order_code,
            order_status=order.order_status,
            payment_status=order.payment_status,
            delivery_date=delivered_date,
            days_since_delivery=days_since_delivery,
            within_return_window=within_return_window,
            can_request_return=overall_can_request,
            can_request_exchange=overall_can_request,
            rejection_reason=rejection_reason,
            items=items_result,
            free_return_shipping_reasons=list(MERCHANT_FAULT_REASONS),
        )

    @classmethod
    def is_merchant_fault(cls, reason_code: str) -> bool:
        """
        Xác định xem lý do có thuộc lỗi từ nhà thuốc hay không.
        """
        return reason_code in MERCHANT_FAULT_REASONS

    @classmethod
    def is_shipping_fee_refundable(
        cls,
        order: Order,
        reason_code: str,
        is_full_return: bool,
    ) -> bool:
        """
        Quy tắc hoàn phí ship ban đầu:
        - Nếu do lỗi Nhà thuốc (giao sai, cận date, hàng hỏng) và hoàn toàn bộ đơn -> Hoàn 100% phí ship ban đầu.
        - Nếu do khách hàng đổi ý / đặt nhầm -> Không hoàn phí ship ban đầu.
        """
        if cls.is_merchant_fault(reason_code) and is_full_return:
            return True
        return False
