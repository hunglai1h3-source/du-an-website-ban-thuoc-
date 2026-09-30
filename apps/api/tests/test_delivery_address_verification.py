import unittest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from datetime import date, timedelta
from app.models import (
    AdministrativeUnit,
    CanonicalProduct,
    InventoryBatch,
    Order,
    PriceObservation,
    ProductSku,
    Warehouse,
    WarehouseBatchStock,
)
from app.models.enums import PublishStatus, RxOtcStatus


class TestDeliveryAddressVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        prod = cls.db.scalar(
            select(CanonicalProduct).where(
                CanonicalProduct.publish_status == PublishStatus.PUBLISHED,
                CanonicalProduct.rx_otc_status == RxOtcStatus.OTC,
            )
        )
        if not prod:
            prod = CanonicalProduct(
                canonical_name="Băng cá nhân Urgo Transparent (Test)",
                manufacturer="Urgo",
                manufacturing_country="Pháp",
                package_description="Hộp 100 miếng",
                publish_status=PublishStatus.PUBLISHED,
                rx_otc_status=RxOtcStatus.OTC,
            )
            cls.db.add(prod)
            cls.db.commit()
            cls.db.refresh(prod)

        cls.test_prod_id = prod.id

        price_obs = cls.db.query(PriceObservation).filter_by(product_id=prod.id).first()
        if not price_obs:
            price_obs = PriceObservation(
                product_id=prod.id,
                source_id=1,
                source_url="https://example.com/products/test-product",
                observed_price=Decimal("45000.0"),
                currency="VND",
            )
            cls.db.add(price_obs)
            cls.db.commit()

        # Đảm bảo kho hoạt động và tồn kho
        wh = cls.db.query(Warehouse).filter_by(code="KHO-HCM-01").first()
        if not wh:
            wh = Warehouse(
                code="KHO-HCM-01",
                name="Kho Dược HCM",
                address="123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                is_active=True,
                is_central=True,
            )
            cls.db.add(wh)
            cls.db.commit()
            cls.db.refresh(wh)
        else:
            wh.is_active = True
            cls.db.commit()

        sku = cls.db.query(ProductSku).filter_by(canonical_product_id=prod.id).first()
        if not sku:
            sku = ProductSku(
                canonical_product_id=prod.id,
                sku_code=f"SKU-TEST-{prod.id}",
                base_price=Decimal("45000.0"),
                is_default=True,
                is_active=True,
            )
            cls.db.add(sku)
            cls.db.commit()
            cls.db.refresh(sku)

        batch = cls.db.query(InventoryBatch).filter_by(sku_id=sku.id).first()
        if not batch:
            batch = InventoryBatch(
                sku_id=sku.id,
                batch_number="BATCH-TEST-VERIFY-01",
                expiry_date=date.today() + timedelta(days=365),
                initial_quantity=500,
                status="ACTIVE",
            )
            cls.db.add(batch)
            cls.db.commit()
            cls.db.refresh(batch)

        stock = cls.db.query(WarehouseBatchStock).filter_by(warehouse_id=wh.id, batch_id=batch.id).first()
        if not stock:
            stock = WarehouseBatchStock(
                warehouse_id=wh.id,
                batch_id=batch.id,
                quantity_on_hand=500,
                quantity_reserved=0,
                quantity_available=500,
            )
            cls.db.add(stock)
            cls.db.commit()
        else:
            stock.quantity_available = 500
            stock.quantity_on_hand = 500
            cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_suggest_rejects_junk_text(self):
        """Autocomplete từ chối các chuỗi rác như 'tt', 'abc', 'nhà tôi', '123 test'."""
        junk_queries = ["tt", "abc", "123 test", "nhà tôi", "dự án xyz", "gần trường"]
        for jq in junk_queries:
            resp = self.client.get(
                "/api/v1/addresses/suggest",
                params={
                    "q": jq,
                    "province_code": "79",
                    "district_code": "760",
                    "ward_code": "26734",
                },
            )
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(len(data), 0, f"Query '{jq}' should return 0 suggestions")

    def test_02_suggest_returns_valid_suggestions_for_real_street(self):
        """Autocomplete trả về gợi ý hợp lệ với số nhà, tên đường cụ thể trong địa giới."""
        resp = self.client.get(
            "/api/v1/addresses/suggest",
            params={
                "q": "45 Hoàng Hoa Thám",
                "province_code": "79",
                "district_code": "766",
                "ward_code": "26965",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreater(len(data), 0)
        item = data[0]
        self.assertTrue(item["verified"])
        self.assertIn("45 Hoàng Hoa Thám", item["street_address"])
        self.assertIn("Tân Bình", item["district_name"])
        self.assertIn("Hồ Chí Minh", item["province_name"])
        self.assertTrue(10.0 <= item["lat"] <= 11.5)
        self.assertTrue(106.0 <= item["lng"] <= 107.2)

    def test_03_delivery_rejected_if_not_verified(self):
        """Chặn đơn giao tận nơi nếu is_verified = False."""
        payload = {
            "customer_name": "Nguyễn Văn Test",
            "customer_phone": "0912345678",
            "shipping_address": "45 Hoàng Hoa Thám, P.13, Q. Tân Bình",
            "fulfillment_type": "DELIVERY",
            "province_code": "79",
            "district_code": "766",
            "ward_code": "26965",
            "lat": 10.7992,
            "lng": 106.6534,
            "is_verified": False,
            "payment_method": "COD",
            "items": [{"product_id": self.test_prod_id, "quantity": 1}],
        }
        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("chưa được xác minh", resp.json()["detail"])

    def test_04_delivery_rejected_if_missing_coordinates(self):
        """Chặn đơn nếu thiếu lat hoặc lng."""
        payload = {
            "customer_name": "Nguyễn Văn Test",
            "customer_phone": "0912345678",
            "shipping_address": "45 Hoàng Hoa Thám, P.13, Q. Tân Bình",
            "fulfillment_type": "DELIVERY",
            "province_code": "79",
            "district_code": "766",
            "ward_code": "26965",
            "lat": None,
            "lng": None,
            "is_verified": True,
            "payment_method": "COD",
            "items": [{"product_id": self.test_prod_id, "quantity": 1}],
        }
        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Thiếu tọa độ", resp.json()["detail"])

    def test_05_cross_province_coordinate_mismatch_rejected(self):
        """Chặn gian lận: Chọn Hà Nội (01) nhưng truyền tọa độ TP.HCM (10.77, 106.70) -> HTTP 400."""
        payload = {
            "customer_name": "Trần Văn Gian Lận",
            "customer_phone": "0912345678",
            "shipping_address": "25 Phố Huế, Hàng Bài, Hoàn Kiếm, Hà Nội",
            "fulfillment_type": "DELIVERY",
            "province_code": "01",
            "district_code": "002",
            "ward_code": "00049",
            # Tọa độ TP.HCM (Quận 1)
            "lat": 10.7769,
            "lng": 106.7009,
            "is_verified": True,
            "payment_method": "COD",
            "items": [{"product_id": self.test_prod_id, "quantity": 1}],
        }
        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("không khớp với phạm vi địa lý", resp.json()["detail"])

    def test_06_cross_province_hcm_with_hanoi_coords_rejected(self):
        """Chặn gian lận: Chọn TP.HCM (79) nhưng truyền tọa độ Hà Nội (21.02, 105.85) -> HTTP 400."""
        payload = {
            "customer_name": "Lê Văn Sai Lệch",
            "customer_phone": "0912345678",
            "shipping_address": "88 Pasteur, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            "fulfillment_type": "DELIVERY",
            "province_code": "79",
            "district_code": "760",
            "ward_code": "26734",
            # Tọa độ Hà Nội
            "lat": 21.0285,
            "lng": 105.8542,
            "is_verified": True,
            "payment_method": "COD",
            "items": [{"product_id": self.test_prod_id, "quantity": 1}],
        }
        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("không khớp với phạm vi địa lý", resp.json()["detail"])

    def test_07_valid_verified_delivery_order_succeeds(self):
        """Đơn hàng có địa chỉ xác minh hợp lệ tạo thành công và lưu đủ cấu trúc."""
        payload = {
            "customer_name": "Đặng Thị Mai",
            "customer_phone": "0918765432",
            "customer_email": "mai.dang@example.com",
            "shipping_address": "Số 45 Đường Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
            "shipping_city": "TP. Hồ Chí Minh",
            "fulfillment_type": "DELIVERY",
            "province_code": "79",
            "district_code": "766",
            "ward_code": "26965",
            "lat": 10.7992,
            "lng": 106.6534,
            "is_verified": True,
            "payment_method": "COD",
            "note": "Gọi trước 15 phút, gửi bảo vệ tòa nhà",
            "items": [{"product_id": self.test_prod_id, "quantity": 2}],
        }
        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")
        order_code = data["order_code"]

        # Kiểm tra CSDL
        order = self.db.query(Order).filter_by(order_code=order_code).first()
        self.assertIsNotNone(order)
        self.assertEqual(order.province_code, "79")
        self.assertEqual(order.district_code, "766")
        self.assertEqual(order.ward_code, "26965")
        self.assertEqual(order.lat, 10.7992)
        self.assertEqual(order.lng, 106.6534)
        self.assertTrue(order.is_verified)
        self.assertEqual(order.note, "Gọi trước 15 phút, gửi bảo vệ tòa nhà")
        # Ghi chú KHÔNG bị dồn vào ô địa chỉ
        self.assertNotIn("Gọi trước 15 phút", order.shipping_address)

    def test_08_store_pickup_order_succeeds_without_home_address(self):
        """Hình thức nhận tại quầy (STORE_PICKUP) không đòi hỏi xác minh địa chỉ nhà riêng."""
        payload = {
            "customer_name": "Phan Hữu Thắng",
            "customer_phone": "0909112233",
            "shipping_address": "Nhận tại: H4CARE Hoàng Hoa Thám (45 Hoàng Hoa Thám, Tân Bình)",
            "shipping_city": "TP. Hồ Chí Minh",
            "fulfillment_type": "STORE_PICKUP",
            "is_verified": False,
            "payment_method": "COD",
            "items": [{"product_id": self.test_prod_id, "quantity": 1}],
        }
        resp = self.client.post("/api/v1/store/orders/checkout", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")


if __name__ == "__main__":
    unittest.main()
