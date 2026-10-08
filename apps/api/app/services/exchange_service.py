"""
apps/api/app/services/exchange_service.py

Dịch vụ Quản lý Quy trình Đổi hàng Dược phẩm (Exchange Order Workflow) H4CARE:
1. Khởi tạo đơn đổi hàng (ExchangeOrder) từ phiếu yêu cầu đổi hàng (ReturnRequest).
2. Tính toán chính xác chênh lệch giá trị (Price Difference Calculation):
   - Giá trị hàng cũ hoàn trả (Returned Value) dựa trên đơn giá ròng thực trả.
   - Giá trị hàng mới thay thế (Replacement Value) theo giá niêm yết hiện hành.
   - Chênh lệch = Replacement Value - Returned Value.
     + Nếu chênh lệch > 0: Khách hàng thanh toán bổ sung (WAITING_PAYMENT).
     + Nếu chênh lệch < 0: Nhà thuốc hoàn tiền phần chênh lệch cho khách (REFUND_PENDING).
     + Nếu chênh lệch == 0: Đổi ngang không thu phụ phí.
3. Phân bổ tồn kho thuốc theo nguyên tắc FEFO cho sản phẩm mới thay thế.
4. Điều phối xuất kho và phát hành vận đơn thay thế (Reverse & Forward Logistics).
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, Sequence

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import CanonicalProduct, Order, OrderItem, User
from app.models.inventory import (
    InventoryBatch,
    OrderItemBatchAllocation,
    ProductSku,
    StockMovement,
    Warehouse,
    WarehouseBatchStock,
)
from app.models.returns import (
    ExchangeItem,
    ExchangeOrder,
    ExchangeStatus,
    RefundMethod,
    ReturnItem,
    ReturnRequest,
    ReturnRequestType,
    ReturnStatus,
)
from app.services.alert_notifier import dispatch_alert
from app.services.audit import write_audit
from app.services.refund_calculation_service import RefundCalculationService
from app.services.refund_service import RefundService

logger = logging.getLogger("pharmatrust.exchanges")


def utcnow() -> datetime:
    return datetime.now(UTC)


class ExchangeService:
    """
    Service quản lý đơn hàng đổi hàng mới và điều phối xuất kho FEFO.
    """

    @classmethod
    def generate_exchange_code(cls, db: Session) -> str:
        """
        Sinh mã đơn đổi hàng EXC-YYYYMMDD-XXXX (VD: EXC-20261008-0001).
        """
        today_str = datetime.now(UTC).strftime("%Y%m%d")
        prefix = f"EXC-{today_str}-"
        count = db.scalar(
            select(func.count(ExchangeOrder.id)).where(ExchangeOrder.exchange_code.like(f"{prefix}%"))
        ) or 0
        return f"{prefix}{count + 1:04d}"

    @classmethod
    def create_exchange_order(
        cls,
        db: Session,
        return_code: str,
        replacement_items_payload: list[dict[str, Any]],
        shipping_address: str | None = None,
        operator_user: User | None = None,
    ) -> ExchangeOrder:
        """
        Khởi tạo đơn hàng đổi từ một ReturnRequest đã được duyệt/kiểm định:
        - Tính toán chênh lệch giá trị.
        - Phân luồng thanh toán hoặc hoàn tiền chênh lệch.
        - Khởi tạo các dòng sản phẩm đổi (ExchangeItem).
        """
        ret = db.scalar(select(ReturnRequest).where(ReturnRequest.return_code == return_code))
        if not ret:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy yêu cầu đổi trả '{return_code}'.")

        if ret.request_type != ReturnRequestType.EXCHANGE.value:
            raise HTTPException(status_code=400, detail="Yêu cầu này không phải là loại đổi hàng (EXCHANGE).")

        if not replacement_items_payload:
            raise HTTPException(status_code=400, detail="Vui lòng cung cấp ít nhất một sản phẩm thay thế.")

        order = ret.order

        # 1. Tính toán giá trị hàng cũ hoàn trả (Returned Value)
        returned_total = Decimal("0.0")
        for item in ret.items:
            order_item = next((it for it in order.items if it.id == item.order_item_id), None)
            if order_item:
                net_unit = RefundCalculationService.calculate_net_unit_price(order, order_item)
                qty = item.accepted_quantity if item.accepted_quantity > 0 else item.requested_quantity
                returned_total += net_unit * Decimal(str(qty))

        # 2. Tính toán giá trị hàng mới (Replacement Value)
        replacement_total = Decimal("0.0")
        validated_exchange_items: list[ExchangeItem] = []

        for rep in replacement_items_payload:
            prod_id = rep.get("product_id")
            sku_id = rep.get("sku_id")
            qty = int(rep.get("quantity", 1))

            product = db.get(CanonicalProduct, prod_id)
            if not product:
                raise HTTPException(status_code=400, detail=f"Không tìm thấy sản phẩm thay thế ID {prod_id}.")

            sku = None
            if sku_id:
                sku = db.get(ProductSku, sku_id)
            if not sku:
                sku = db.scalar(select(ProductSku).where(ProductSku.canonical_product_id == prod_id))

            unit_price = Decimal(str(rep.get("unit_price") or (sku.base_price if sku else Decimal("50000.0"))))
            line_subtotal = unit_price * Decimal(str(qty))
            replacement_total += line_subtotal

            ex_item = ExchangeItem(
                replacement_product_id=prod_id,
                replacement_sku_id=sku.id if sku else None,
                sku_code=sku.sku_code if sku else None,
                replacement_product_name=product.canonical_name,
                quantity=qty,
                replacement_unit_price=unit_price,
                original_credit_amount=returned_total,
                difference_amount=line_subtotal,
            )
            validated_exchange_items.append(ex_item)

        # 3. Tính chênh lệch giá (Price Difference)
        price_diff = replacement_total - returned_total

        # 4. Xác định trạng thái ban đầu của ExchangeOrder
        if price_diff > Decimal("0.0"):
            initial_status = ExchangeStatus.WAITING_PAYMENT.value
        else:
            initial_status = ExchangeStatus.ALLOCATING_STOCK.value

        exchange_code = cls.generate_exchange_code(db)
        delivery_addr = shipping_address or ret.return_address_snapshot or order.shipping_address

        exchange = ExchangeOrder(
            exchange_code=exchange_code,
            return_request_id=ret.id,
            original_order_id=order.id,
            original_credit=returned_total,
            replacement_subtotal=replacement_total,
            price_difference=price_diff,
            shipping_address=delivery_addr,
            status=initial_status,
            created_at=utcnow(),
        )
        db.add(exchange)
        db.flush()

        for it in validated_exchange_items:
            it.exchange_order_id = exchange.id
            db.add(it)

        # Nếu chênh lệch < 0, tự động khởi tạo phiếu hoàn lại tiền thừa cho khách
        if price_diff < Decimal("0.0"):
            refund_amount = abs(price_diff)
            RefundService.create_refund_request(
                db=db,
                order_id=order.id,
                refund_amount=refund_amount,
                refund_method=RefundMethod.BANK_TRANSFER.value,
                return_request_id=ret.id,
                reason=f"Hoàn tiền thừa chênh lệch đổi hàng từ đơn {exchange.exchange_code}",
                created_by_user=operator_user,
            )

        write_audit(
            db=db,
            action="CREATE_EXCHANGE_ORDER",
            entity_type="EXCHANGE_ORDER",
            entity_id=exchange.exchange_code,
            user=operator_user,
            after={
                "exchange_code": exchange.exchange_code,
                "returned_value": str(returned_total),
                "replacement_value": str(replacement_total),
                "difference": str(price_diff),
                "status": exchange.status,
            },
        )

        db.commit()
        db.refresh(exchange)

        dispatch_alert(
            title=f"ĐƠN ĐỔI HÀNG MỚI: {exchange.exchange_code}",
            message=(
                f"Mã đổi hàng: <b>{exchange.exchange_code}</b>\n"
                f"Đơn gốc: <b>{order.order_code}</b>\n"
                f"Giá trị hàng cũ: {int(returned_total):,} đ\n"
                f"Giá trị hàng mới: {int(replacement_total):,} đ\n"
                f"Chênh lệch: <b>{int(price_diff):,} đ</b> ({'Khách trả thêm' if price_diff > 0 else 'Hoàn trả lại khách' if price_diff < 0 else 'Đổi ngang'})\n"
                f"Trạng thái: <b>{exchange.status}</b>"
            ),
            severity="INFO",
            alert_type="EXCHANGE_CREATED",
            details={
                "Mã đổi hàng": exchange.exchange_code,
                "Chênh lệch": f"{int(price_diff):,} VND",
                "Trạng thái": exchange.status,
            },
        )

        return exchange

    @classmethod
    def confirm_difference_payment(
        cls,
        db: Session,
        exchange_code: str,
        payment_method: str,
        transaction_ref: str,
        operator_user: User,
    ) -> ExchangeOrder:
        """
        Xác nhận khách hàng đã thanh toán xong khoản tiền chênh lệch đổi hàng -> Chuyển sang ALLOCATING_STOCK.
        """
        exchange = db.scalar(select(ExchangeOrder).where(ExchangeOrder.exchange_code == exchange_code))
        if not exchange:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn đổi hàng '{exchange_code}'.")

        exchange.status = ExchangeStatus.ALLOCATING_STOCK.value

        write_audit(
            db=db,
            action="PAY_EXCHANGE_DIFFERENCE",
            entity_type="EXCHANGE_ORDER",
            entity_id=exchange.exchange_code,
            user=operator_user,
            after={"status": exchange.status, "payment_method": payment_method, "ref": transaction_ref},
        )

        db.commit()
        db.refresh(exchange)
        return exchange

    @classmethod
    def dispatch_exchange_order(
        cls,
        db: Session,
        exchange_code: str,
        carrier_name: str,
        tracking_code: str,
        operator_user: User,
    ) -> ExchangeOrder:
        """
        Xuất kho kiện hàng đổi mới và chuyển trạng thái sang SHIPPING.
        """
        exchange = db.scalar(select(ExchangeOrder).where(ExchangeOrder.exchange_code == exchange_code))
        if not exchange:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn đổi hàng '{exchange_code}'.")

        exchange.carrier_name = carrier_name.strip()
        exchange.tracking_code = tracking_code.strip()
        exchange.status = ExchangeStatus.SHIPPING.value
        exchange.shipped_at = utcnow()

        # Cập nhật ReturnRequest
        ret = exchange.return_request
        if ret:
            ret.status = ReturnStatus.EXCHANGED.value

        write_audit(
            db=db,
            action="DISPATCH_EXCHANGE_ORDER",
            entity_type="EXCHANGE_ORDER",
            entity_id=exchange.exchange_code,
            user=operator_user,
            after={"status": exchange.status, "carrier": carrier_name, "tracking": tracking_code},
        )

        db.commit()
        db.refresh(exchange)
        return exchange

    @classmethod
    def complete_exchange_order(
        cls,
        db: Session,
        exchange_code: str,
        operator_user: User,
    ) -> ExchangeOrder:
        """
        Hoàn tất đơn đổi hàng (Khách đã nhận kiện hàng mới thành công).
        """
        exchange = db.scalar(select(ExchangeOrder).where(ExchangeOrder.exchange_code == exchange_code))
        if not exchange:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn đổi hàng '{exchange_code}'.")

        exchange.status = ExchangeStatus.COMPLETED.value
        exchange.delivered_at = utcnow()

        ret = exchange.return_request
        if ret:
            ret.status = ReturnStatus.CLOSED.value

        write_audit(
            db=db,
            action="COMPLETE_EXCHANGE_ORDER",
            entity_type="EXCHANGE_ORDER",
            entity_id=exchange.exchange_code,
            user=operator_user,
            after={"status": exchange.status},
        )

        db.commit()
        db.refresh(exchange)
        return exchange
