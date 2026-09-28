import sys
import unittest
from pathlib import Path

# Add apps/api to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models import CanonicalProduct, PriceObservation, DataSource
from app.models.enums import PublishStatus, RxOtcStatus, RegulatoryStatus


class TestPharmaTrustIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Login as Admin
        res = cls.client.post("/api/v1/auth/login", json={
            "email": "admin@pharmatrust.vn",
            "password": "Admin@123456"
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        token = res.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {token}"}

    def test_01_health_and_auth(self):
        """Tiêu chí 10: Health check và xác thực Admin hoạt động chuẩn xác"""
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

        # Sai mật khẩu phải bị chặn 401
        bad_login = self.client.post("/api/v1/auth/login", json={
            "email": "admin@pharmatrust.vn",
            "password": "wrong-password"
        })
        self.assertEqual(bad_login.status_code, 401)

    def test_02_permission_isolation(self):
        """Tiêu chí 3: Người thường không có token không thể truy cập API quản trị"""
        # Thử duyệt sản phẩm mà không có token
        res = self.client.post("/api/v1/products/16/publish")
        self.assertEqual(res.status_code, 401)

        # Thử đổi giá mà không có token
        res = self.client.patch("/api/v1/products/16/pricing", json={"price": 100000})
        self.assertEqual(res.status_code, 401)

    def test_03_legacy_apis_intact(self):
        """Tiêu chí 10: Các API cũ quan trọng vẫn hoạt động 100%"""
        res = self.client.get("/api/v1/sources", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json()) > 0)

        res = self.client.get("/api/v1/dashboard/summary", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)

    def test_04_full_lifecycle_crawl_to_storefront(self):
        """Tiêu chí 5, 6, 7, 8: Luồng Cào -> Chờ duyệt -> Duyệt -> Hiển thị Storefront -> Ẩn"""
        db = SessionLocal()
        test_prod_name = "TEST_INTEGRATION_MEDICINE_2026"
        try:
            # 1. Giả lập một thuốc mới cào về được lưu vào catalog ở trạng thái DRAFT
            test_prod = CanonicalProduct(
                canonical_name=test_prod_name,
                registration_number="VN-TEST-9999",
                dosage_form="Viên nén bao phim",
                manufacturer="PharmaTrust Test Lab",
                manufacturing_country="Việt Nam",
                image_url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae",
                description="Thuốc kiểm thử tích hợp tự động",
                indications="Kiểm tra luồng xuất bản bán hàng",
                usage_instructions="Chỉ dùng trong kiểm thử tự động",
                rx_otc_status=RxOtcStatus.OTC,
                regulatory_status=RegulatoryStatus.ACTIVE,
                publish_status=PublishStatus.DRAFT,  # MỚI CÀO -> DRAFT
                is_demo=False
            )
            db.add(test_prod)
            db.commit()
            db.refresh(test_prod)
            test_id = test_prod.id

            # Gán giá quan sát
            source = db.query(DataSource).first()
            po = PriceObservation(
                product_id=test_id,
                source_id=source.id if source else 1,
                observed_price=68000,
                currency="VND",
                availability_text="Có sẵn",
                source_url="https://pharmatrust.vn/test"
            )
            db.add(po)
            db.commit()

            # TIÊU CHÍ 5: Thuốc ở trạng thái DRAFT KHÔNG ĐƯỢC xuất hiện trên Storefront khách hàng!
            store_res = self.client.get(f"/api/v1/store/products?search={test_prod_name}")
            self.assertEqual(store_res.status_code, 200)
            items = store_res.json()["items"]
            self.assertEqual(len(items), 0, "LỖI: Thuốc DRAFT lại xuất hiện trên Storefront!")

            # TIÊU CHÍ 6: Admin duyệt đăng bán thuốc
            pub_res = self.client.post(f"/api/v1/products/{test_id}/publish", headers=self.admin_headers)
            self.assertEqual(pub_res.status_code, 200)
            self.assertEqual(pub_res.json()["publish_status"], "PUBLISHED")

            # TIÊU CHÍ 7: Thuốc đã duyệt lập tức xuất hiện trên Storefront
            store_res2 = self.client.get(f"/api/v1/store/products?search={test_prod_name}")
            self.assertEqual(store_res2.status_code, 200)
            items2 = store_res2.json()["items"]
            self.assertEqual(len(items2), 1, "LỖI: Thuốc đã duyệt không xuất hiện trên Storefront!")
            self.assertEqual(items2[0]["name"], test_prod_name)
            self.assertEqual(items2[0]["price"], 68000)

            # Kiểm tra chi tiết thuốc
            detail_res = self.client.get(f"/api/v1/store/products/{test_id}")
            self.assertEqual(detail_res.status_code, 200)
            self.assertEqual(detail_res.json()["indications"], "Kiểm tra luồng xuất bản bán hàng")

            # TIÊU CHÍ 8: Admin tạm ẩn / ngừng bán thuốc
            unpub_res = self.client.post(f"/api/v1/products/{test_id}/unpublish", headers=self.admin_headers)
            self.assertEqual(unpub_res.status_code, 200)
            self.assertEqual(unpub_res.json()["publish_status"], "DRAFT")

            # Kiểm tra lại trên Storefront: Thuốc phải biến mất ngay lập tức!
            store_res3 = self.client.get(f"/api/v1/store/products?search={test_prod_name}")
            self.assertEqual(store_res3.status_code, 200)
            items3 = store_res3.json()["items"]
            self.assertEqual(len(items3), 0, "LỖI: Thuốc đã ngừng bán vẫn còn trên Storefront!")

        finally:
            # Dọn dẹp bản ghi kiểm thử
            test_entity = db.query(CanonicalProduct).filter(CanonicalProduct.canonical_name == test_prod_name).first()
            if test_entity:
                db.query(PriceObservation).filter(PriceObservation.product_id == test_entity.id).delete()
                db.delete(test_entity)
                db.commit()
            db.close()


if __name__ == "__main__":
    unittest.main()
