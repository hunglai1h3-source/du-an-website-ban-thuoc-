import datetime
import random
from decimal import Decimal
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import CanonicalProduct, Order, OrderItem, PriceObservation, User
from app.models.enums import UserRole
from app.services.alert_notifier import dispatch_alert

router = APIRouter(tags=["Đơn Hàng & Mua Sắm"])
store_order_router = APIRouter(prefix="/store/orders", tags=["Storefront Khách Hàng - Đơn Hàng"])
admin_order_router = APIRouter(prefix="/admin/orders", tags=["Quản Trị Đơn Hàng"])


# --- Schemas ---
class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=100)
    price: Optional[float] = None


class CheckoutRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=255)
    customer_phone: str = Field(..., min_length=5, max_length=25)
    customer_email: Optional[str] = None
    shipping_address: str = Field(..., min_length=2, max_length=500)
    shipping_city: Optional[str] = "Toàn quốc"
    payment_method: str = "COD"  # COD | BANK_TRANSFER
    note: Optional[str] = None
    items: List[CheckoutItem] = Field(..., min_length=1)


class UpdateOrderStatusRequest(BaseModel):
    order_status: str  # PENDING | CONFIRMED | PROCESSING | SHIPPING | COMPLETED | CANCELLED
    payment_status: Optional[str] = None


def generate_order_code() -> str:
    now_str = datetime.datetime.now().strftime("%y%m%d")
    rand_suffix = random.randint(1000, 9999)
    return f"PT-{now_str}-{rand_suffix}"


# ==========================================
# 1. STOREFRONT CHECKOUT & TRA CỨU ĐƠN HÀNG
# ==========================================
@store_order_router.post("/checkout")
def checkout_order(payload: CheckoutRequest, db: Session = Depends(get_db)):
    """
    Tạo đơn hàng mới từ Storefront Web Khách Hàng.
    Tự động tính tổng tiền, liên kết kho thuốc và gửi thông báo tới Admin.
    """
    name = payload.customer_name.strip()
    phone = payload.customer_phone.strip()
    address = payload.shipping_address.strip()

    if not name or not phone or not address:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.")

    # Tìm thông tin sản phẩm và tính tổng tiền
    product_ids = [it.product_id for it in payload.items]
    products = db.scalars(
        select(CanonicalProduct).where(CanonicalProduct.id.in_(product_ids))
    ).all()
    products_map = {p.id: p for p in products}

    # Giá bán thực tế
    prices_map: dict[int, Decimal] = {}
    price_rows = db.query(PriceObservation.product_id, PriceObservation.observed_price).filter(
        PriceObservation.product_id.in_(product_ids)
    ).all()
    for pid, pval in price_rows:
        if pid not in prices_map and pval is not None:
            prices_map[pid] = Decimal(str(pval))

    order_items_to_add = []
    total_amount = Decimal("0.0")

    for item in payload.items:
        prod = products_map.get(item.product_id)
        prod_name = prod.canonical_name if prod else f"Thuốc ID #{item.product_id}"
        prod_sku = prod.registration_number if prod else None

        # Xác định đơn giá
        if item.price and item.price > 0:
            unit_price = Decimal(str(item.price))
        elif item.product_id in prices_map:
            unit_price = prices_map[item.product_id]
        else:
            unit_price = Decimal("50000.0")  # Fallback

        subtotal = unit_price * item.quantity
        total_amount += subtotal

        order_items_to_add.append(
            OrderItem(
                product_id=item.product_id,
                product_name=prod_name,
                product_sku=prod_sku,
                price=unit_price,
                quantity=item.quantity,
                subtotal=subtotal,
            )
        )

    order_code = generate_order_code()
    order = Order(
        order_code=order_code,
        customer_name=name,
        customer_phone=phone,
        customer_email=payload.customer_email.strip() if payload.customer_email else None,
        shipping_address=address,
        shipping_city=payload.shipping_city or "Toàn quốc",
        payment_method=payload.payment_method.upper(),
        payment_status="PENDING",
        order_status="PENDING",
        total_amount=total_amount,
        shipping_fee=Decimal("0.0"),
        note=payload.note,
        items=order_items_to_add,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Gửi cảnh báo tức thì tới Telegram Quản trị viên
    items_summary = ", ".join([f"{it.product_name} (x{it.quantity})" for it in order_items_to_add[:3]])
    if len(order_items_to_add) > 3:
        items_summary += f" và {len(order_items_to_add) - 3} sản phẩm khác"

    dispatch_alert(
        title="ĐƠN HÀNG MỚI TỪ STOREFRONT",
        message=(
            f"Mã đơn: <b>{order.order_code}</b>\n"
            f"Khách hàng: <b>{order.customer_name}</b> - SĐT: <code>{order.customer_phone}</code>\n"
            f"Địa chỉ: {order.shipping_address}\n"
            f"Tổng tiền: <b>{int(order.total_amount):,} đ</b>\n"
            f"Sản phẩm: {items_summary}"
        ),
        severity="INFO",
        alert_type="NEW_ORDER",
        details={
            "Mã đơn hàng": order.order_code,
            "Thanh toán": order.payment_method,
            "Tổng thanh toán": f"{int(order.total_amount):,} VND",
        },
    )

    return {
        "status": "SUCCESS",
        "message": f"Đặt hàng thành công! Mã đơn của bạn là {order.order_code}.",
        "order_code": order.order_code,
        "total_amount": float(order.total_amount),
        "order_status": order.order_status,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


@store_order_router.get("/{order_code}")
def get_order_by_code(order_code: str, db: Session = Depends(get_db)):
    """
    Tra cứu thông tin tiến độ đơn hàng cho khách hàng.
    """
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_code == order_code.strip())
    )
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng với mã này.")

    return {
        "order_code": order.order_code,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "order_status": order.order_status,
        "total_amount": float(order.total_amount),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "product_id": it.product_id,
                "product_name": it.product_name,
                "price": float(it.price),
                "quantity": it.quantity,
                "subtotal": float(it.subtotal),
            }
            for it in order.items
        ],
    }


@store_order_router.get("/customer/{phone}")
def get_customer_orders(phone: str, db: Session = Depends(get_db)):
    """
    Lấy danh sách đơn hàng riêng biệt của khách hàng theo số điện thoại (bảo đảm cách ly tài khoản).
    """
    clean_phone = phone.strip().replace(" ", "").replace("-", "")
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            or_(
                Order.customer_phone == phone.strip(),
                Order.customer_phone == clean_phone,
            )
        )
        .order_by(desc(Order.id))
        .limit(20)
    ).all()

    return [
        {
            "id": o.id,
            "order_code": o.order_code,
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "shipping_address": o.shipping_address,
            "total_amount": float(o.total_amount),
            "order_status": o.order_status,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items_count": len(o.items),
            "items": [
                {
                    "product_name": it.product_name,
                    "quantity": it.quantity,
                    "price": float(it.price),
                    "subtotal": float(it.subtotal),
                }
                for it in o.items
            ],
        }
        for o in orders
    ]


# ==========================================
# 2. ADMIN QUẢN LÝ ĐƠN HÀNG
# ==========================================
@admin_order_router.get("")
def list_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
):
    """
    Danh sách đơn hàng dành cho Admin quản lý.
    """
    query = select(Order).options(selectinload(Order.items))

    if status and status.upper() != "ALL":
        query = query.where(Order.order_status == status.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Order.order_code.ilike(term),
                Order.customer_name.ilike(term),
                Order.customer_phone.ilike(term),
            )
        )

    total = db.scalar(select(Order).with_only_columns(Order.id).order_by(None))
    orders = db.scalars(
        query.order_by(desc(Order.id)).offset((page - 1) * page_size).limit(page_size)
    ).all()

    return {
        "items": [
            {
                "id": o.id,
                "order_code": o.order_code,
                "customer_name": o.customer_name,
                "customer_phone": o.customer_phone,
                "shipping_address": o.shipping_address,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "total_amount": float(o.total_amount),
                "items_count": len(o.items),
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ],
        "page": page,
        "page_size": page_size,
    }


@admin_order_router.get("/{order_id}")
def get_admin_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
):
    """
    Chi tiết đơn hàng cho Admin xử lý.
    """
    order = db.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")

    return {
        "id": order.id,
        "order_code": order.order_code,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "customer_email": order.customer_email,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "order_status": order.order_status,
        "total_amount": float(order.total_amount),
        "note": order.note,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "id": it.id,
                "product_id": it.product_id,
                "product_name": it.product_name,
                "product_sku": it.product_sku,
                "price": float(it.price),
                "quantity": it.quantity,
                "subtotal": float(it.subtotal),
            }
            for it in order.items
        ],
    }


@admin_order_router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    payload: UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
):
    """
    Cập nhật trạng thái đơn hàng (Duyệt, Giao, Hoàn thành, Hủy).
    """
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")

    valid_statuses = {"PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"}
    if payload.order_status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}")

    order.order_status = payload.order_status.upper()
    if payload.payment_status:
        order.payment_status = payload.payment_status.upper()

    db.commit()
    return {
        "status": "UPDATED",
        "message": f"Đã cập nhật trạng thái đơn {order.order_code} thành {order.order_status}.",
        "order_id": order.id,
        "order_status": order.order_status,
        "payment_status": order.payment_status,
    }
