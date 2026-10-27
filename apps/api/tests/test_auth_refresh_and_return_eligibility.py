import uuid
from datetime import UTC, datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, create_refresh_token, create_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.entities import Order, OrderItem, User
from app.models.enums import UserRole


@pytest.fixture
def auth_test_context(database):
    suffix = uuid.uuid4().hex[:6]
    with SessionLocal() as db:
        user = User(
            email=f"return_tester_{suffix}@pharmatrust.vn",
            password_hash=hash_password("Pass@123456"),
            full_name="Nguyễn Văn Test Đổi Trả",
            role=UserRole.CUSTOMER,
            phone="0911223344",
            is_active=True,
            token_version=1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        order = Order(
            order_code=f"PT-TEST-{suffix.upper()}",
            user_id=user.id,
            customer_name=user.full_name,
            customer_phone=user.phone,
            shipping_address="123 Nguyễn Huệ, Q1, TP.HCM",
            total_amount=50000.0,
            order_status="DELIVERED",
            payment_status="PAID",
            payment_method="PAYOS",
            assigned_warehouse_id=1,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        order_item = OrderItem(
            order_id=order.id,
            product_id=1,
            product_name="Efferalgan 500mg",
            product_sku="EFF-500",
            quantity=2,
            price=25000.0,
            subtotal=50000.0,
        )
        db.add(order_item)
        db.commit()

        yield {
            "user_id": user.id,
            "order_code": order.order_code,
        }


def test_01_expired_access_token_rejected_with_401(auth_test_context):
    client = TestClient(app)
    user_id = str(auth_test_context["user_id"])
    order_code = auth_test_context["order_code"]

    # Tạo access token đã hết hạn 5 phút trước
    expired_token = create_token(
        user_id,
        "access",
        timedelta(minutes=-5),
        {"role": "CUSTOMER", "token_version": 1},
    )

    resp = client.get(
        f"/api/v1/returns/eligibility/{order_code}",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
    assert "Token không hợp lệ hoặc đã hết hạn" in resp.json()["detail"]


def test_02_refresh_token_issues_valid_new_tokens(auth_test_context):
    client = TestClient(app)
    user_id = str(auth_test_context["user_id"])

    # Tạo refresh token hợp lệ
    refresh_token = create_refresh_token(user_id)

    resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["expires_in"] > 0

    # Dùng access token mới này để gọi /auth/me
    new_access_token = data["access_token"]
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {new_access_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["id"] == int(user_id)


def test_03_invalid_refresh_token_rejected_with_401():
    client = TestClient(app)

    # 1. Token sai định dạng
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.jwt.token"})
    assert resp.status_code == 401

    # 2. Token refresh nhưng đã hết hạn
    expired_refresh = create_token("9999", "refresh", timedelta(days=-1))
    resp_exp = client.post("/api/v1/auth/refresh", json={"refresh_token": expired_refresh})
    assert resp_exp.status_code == 401


def test_04_eligibility_check_succeeds_with_refreshed_token(auth_test_context):
    client = TestClient(app)
    user_id = str(auth_test_context["user_id"])
    order_code = auth_test_context["order_code"]

    # Bước 1: Refresh lấy token mới
    refresh_tok = create_refresh_token(user_id)
    ref_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert ref_resp.status_code == 200
    fresh_access_token = ref_resp.json()["access_token"]

    # Bước 2: Kiểm tra điều kiện đổi trả với token mới
    elig_resp = client.get(
        f"/api/v1/returns/eligibility/{order_code}",
        headers={"Authorization": f"Bearer {fresh_access_token}"},
    )
    assert elig_resp.status_code == 200
    elig_data = elig_resp.json()
    assert elig_data["order_code"] == order_code
    assert elig_data["can_request_return"] is True
    assert len(elig_data["items"]) == 1
    assert elig_data["items"][0]["product_name"] == "Efferalgan 500mg"
    assert elig_data["items"][0]["is_eligible"] is True


def test_05_live_chat_init_with_customer_address(auth_test_context):
    from app.models.inventory import CustomerAddress

    client = TestClient(app)
    user_id = auth_test_context["user_id"]

    # Tạo địa chỉ cho khách hàng
    with SessionLocal() as db:
        addr = CustomerAddress(
            user_id=user_id,
            recipient_name="Nguyễn Văn Test",
            phone="0911223344",
            address_line="123 Lê Lợi, Bến Nghé, Q1",
            province_name="Thành phố Hồ Chí Minh",
            lat=10.7769,
            lng=106.7009,
            is_default=True,
        )
        db.add(addr)
        db.commit()

    token = create_access_token(str(user_id), "CUSTOMER", 1)

    # Khởi tạo phiên live chat
    resp = client.post(
        "/api/v1/live-chat/sessions",
        json={"customer_name": "Nguyễn Văn Test", "customer_phone": "0911223344"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_code"].startswith("CHAT-")
    assert data["customer_id"] == user_id
