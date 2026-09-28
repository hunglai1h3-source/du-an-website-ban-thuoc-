import unittest
from decimal import Decimal
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.main import app
from app.models.entities import CanonicalProduct, Order, OrderItem, User
from app.models.enums import PublishStatus, RegulatoryStatus, RxOtcStatus, UserRole
from app.core.security import create_access_token


class TestOrdersSystem(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Tạo sản phẩm mẫu
        self.prod = CanonicalProduct(
            id=501,
            canonical_name="Thuốc hạ sốt Hapacol 250mg",
            registration_number="VD-11223-19",
            regulatory_status=RegulatoryStatus.ACTIVE,
            rx_otc_status=RxOtcStatus.OTC,
            publish_status=PublishStatus.PUBLISHED,
        )
        self.db.merge(self.prod)

        # Tạo admin user
        self.admin = self.db.query(User).filter_by(email="admin_orders@pharmatrust.vn").first()
        if not self.admin:
            self.admin = User(
                email="admin_orders@pharmatrust.vn",
                full_name="Admin Orders",
                role=UserRole.ADMIN,
                password_hash="test_hash",
                is_active=True,
            )
            self.db.add(self.admin)
            self.db.commit()
            self.db.refresh(self.admin)

        token = create_access_token(str(self.admin.id), self.admin.role.value)
        self.headers = {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        # Cleanup test orders
        test_orders = self.db.query(Order).filter(Order.order_code.like("PT-%")).all()
        for o in test_orders:
            self.db.delete(o)
        self.db.commit()
        self.db.close()

    def test_01_storefront_checkout_order(self):
        """Khách hàng đặt hàng từ Storefront tạo đơn thành công và lưu CSDL."""
        payload = {
            "customer_name": "Nguyễn Văn An",
            "customer_phone": "0987654321",
            "customer_email": "an.nguyen@example.com",
            "shipping_address": "Số 123 Đường Cầu Giấy, Hà Nội",
            "shipping_city": "Hà Nội",
            "payment_method": "COD",
            "note": "Giao giờ hành chính",
            "items": [
                {
                    "product_id": 501,
                    "quantity": 2,
                    "price": 45000.0,
                }
            ],
        }

        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()

        self.assertEqual(data["status"], "SUCCESS")
        self.assertTrue(data["order_code"].startswith("PT-"))
        self.assertEqual(data["total_amount"], 90000.0)
        self.assertEqual(data["order_status"], "PENDING")

        # Kiểm tra CSDL
        order_in_db = self.db.query(Order).filter_by(order_code=data["order_code"]).first()
        self.assertIsNotNone(order_in_db)
        self.assertEqual(order_in_db.customer_name, "Nguyễn Văn An")
        self.assertEqual(len(order_in_db.items), 1)
        self.assertEqual(order_in_db.items[0].quantity, 2)
        self.assertEqual(order_in_db.items[0].subtotal, Decimal("90000.0"))

    def test_02_get_order_by_code(self):
        """Khách tra cứu thông tin đơn hàng qua mã đơn."""
        # Dọn dẹp đơn cũ nếu còn tồn tại
        old = self.db.query(Order).filter_by(order_code="PT-260927-9999").first()
        if old:
            self.db.delete(old)
            self.db.commit()

        # Tạo trước 1 đơn hàng
        order = Order(
            order_code="PT-260927-9999",
            customer_name="Trần Thị Bình",
            customer_phone="0912345678",
            shipping_address="456 Hai Bà Trưng, TP.HCM",
            payment_method="COD",
            payment_status="PENDING",
            order_status="PENDING",
            total_amount=Decimal("150000.0"),
            items=[
                OrderItem(
                    product_id=501,
                    product_name="Thuốc hạ sốt Hapacol 250mg",
                    price=Decimal("50000.0"),
                    quantity=3,
                    subtotal=Decimal("150000.0"),
                )
            ],
        )
        self.db.add(order)
        self.db.commit()

        resp = self.client.get(f"/api/v1/store/orders/{order.order_code}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["order_code"], "PT-260927-9999")
        self.assertEqual(data["customer_name"], "Trần Thị Bình")
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["quantity"], 3)

    def test_03_admin_list_and_update_status(self):
        """Admin xem danh sách đơn hàng và chuyển trạng thái."""
        # Tạo trước 1 đơn hàng độc lập cho test_03
        order = Order(
            order_code="PT-260927-8888",
            customer_name="Lê Văn Cường",
            customer_phone="0933333333",
            shipping_address="789 Điện Biên Phủ, TP.HCM",
            payment_method="COD",
            payment_status="PENDING",
            order_status="PENDING",
            total_amount=Decimal("100000.0"),
            items=[
                OrderItem(
                    product_id=501,
                    product_name="Thuốc hạ sốt Hapacol 250mg",
                    price=Decimal("50000.0"),
                    quantity=2,
                    subtotal=Decimal("100000.0"),
                )
            ],
        )
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)

        # Lấy danh sách
        resp = self.client.get("/api/v1/admin/orders", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("items", data)
        self.assertGreaterEqual(len(data["items"]), 1)

        # Cập nhật trạng thái
        update_resp = self.client.patch(
            f"/api/v1/admin/orders/{order.id}/status",
            headers=self.headers,
            json={"order_status": "CONFIRMED", "payment_status": "PAID"},
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.json()["order_status"], "CONFIRMED")

        self.db.refresh(order)
        self.assertEqual(order.order_status, "CONFIRMED")
        self.assertEqual(order.payment_status, "PAID")


if __name__ == "__main__":
    unittest.main()
