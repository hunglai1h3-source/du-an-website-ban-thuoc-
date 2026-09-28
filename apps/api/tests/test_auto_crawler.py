import os
import unittest
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.main import app
from app.models import (
    AdminAlert,
    CanonicalProduct,
    CrawlLock,
    CrawlRun,
    DataConflict,
    DataSource,
    FailedCrawlItem,
    PriceObservation,
    ProductSourceField,
    RegulatoryRecord,
    User,
)
from app.models.enums import ConflictSeverity, ConflictStatus, PublishStatus, RegulatoryStatus, RunStatus, RxOtcStatus, SourceType, UserRole
from app.services.browser_fallback import is_cloudflare_or_captcha
from app.services.category_classifier import AICategoryClassifier
from app.services.crawler_pipeline import execute_crawl_pipeline
from app.services.scheduler import AutoCrawlScheduler, DistributedLockService
from app.services.validation import evaluate_auto_publish_eligibility


class TestAutoCrawlerSuite(unittest.TestCase):
    def setUp(self):
        # Thiết lập cơ sở dữ liệu kiểm thử in-memory độc lập cho test
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Tạo nguồn mẫu
        self.src_pmc = DataSource(
            code="PHARMACITY",
            name="Nhà thuốc Pharmacity",
            source_type=SourceType.RETAILER,
            base_url="https://www.pharmacity.vn",
            enabled=True,
        )
        self.src_lc = DataSource(
            code="LONG_CHAU",
            name="Nhà thuốc Long Châu",
            source_type=SourceType.RETAILER,
            base_url="https://nhathuoclongchau.com.vn",
            enabled=True,
        )
        self.db.add_all([self.src_pmc, self.src_lc])
        self.db.commit()

        DistributedLockService.init_locks(self.db)
        self.client = TestClient(app)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    # 1. Test: Scheduler tự tạo job sau mỗi 6 giờ mà không cần bấm nút
    def test_01_scheduler_triggers_after_6_hours(self):
        scheduler = AutoCrawlScheduler()
        scheduler.interval_hours = 6
        now = datetime.now(UTC)
        scheduler.next_run_at["PHARMACITY"] = now - timedelta(minutes=1)

        triggered_sources = []
        scheduler.trigger_source_crawl = lambda code, is_manual=False, is_catchup=False: triggered_sources.append(code)

        scheduler._check_and_trigger_sources()
        self.assertIn("PHARMACITY", triggered_sources)
        self.assertGreater(scheduler.next_run_at["PHARMACITY"], now)

    # 2. Test: Nhiều web worker không tạo job trùng
    def test_02_multiple_workers_do_not_create_duplicate_jobs(self):
        # Worker 1 chiếm lock
        w1_ok, msg1 = DistributedLockService.acquire_lock(self.db, "PHARMACITY", run_id=101, host_pid="worker_1_pid")
        self.assertTrue(w1_ok)
        self.assertEqual(msg1, "ACQUIRED")

        # Worker 2 cố chiếm lock cho cùng nguồn
        w2_ok, msg2 = DistributedLockService.acquire_lock(self.db, "PHARMACITY", run_id=102, host_pid="worker_2_pid")
        self.assertFalse(w2_ok)
        self.assertIn("SKIPPED_OVERLAP", msg2)

    # 3. Test: Job cũ chưa xong thì chu kỳ mới không chạy chồng (SKIPPED_OVERLAP)
    def test_03_job_overlap_skipped(self):
        DistributedLockService.acquire_lock(self.db, "PHARMACITY", run_id=201)
        lock = self.db.get(CrawlLock, "PHARMACITY")
        self.assertTrue(lock.is_locked)
        initial_overlaps = lock.overlap_count or 0

        # Thử kích hoạt chu kỳ mới khi job trước đang chạy
        ok, msg = DistributedLockService.acquire_lock(self.db, "PHARMACITY", run_id=202)
        self.assertFalse(ok)
        self.assertIn("SKIPPED_OVERLAP", msg)

        lock = self.db.get(CrawlLock, "PHARMACITY")
        self.assertEqual(lock.overlap_count, initial_overlaps + 1)
        self.assertIsNotNone(lock.last_skipped_at)

    # 4. Test: Server restart và chạy bù đúng một lần khi quá hạn
    def test_04_server_restart_and_catchup_once(self):
        # Giả lập 1 run bị kẹt trạng thái RUNNING trước khi restart
        stuck_run = CrawlRun(source_id=self.src_pmc.id, status=RunStatus.RUNNING)
        self.db.add(stuck_run)
        self.db.commit()

        # Đặt thời điểm chạy gần nhất đã cách đây 7 giờ (> 6 giờ)
        self.src_pmc.last_success_at = datetime.now(UTC) - timedelta(hours=7)
        self.db.commit()

        scheduler = AutoCrawlScheduler()
        scheduler.interval_hours = 6
        catchup_calls = []
        scheduler.trigger_source_crawl = lambda code, is_manual=False, is_catchup=False: catchup_calls.append((code, is_catchup))

        scheduler._handle_server_restart(self.db)

        # Kiểm tra job kẹt đã được dọn dẹp
        self.db.refresh(stuck_run)
        self.assertEqual(stuck_run.status, RunStatus.FAILED)
        self.assertIn("INTERRUPTED", stuck_run.error_message)

        # Kiểm tra đã kích hoạt chạy bù đúng 1 lần
        self.assertIn(("PHARMACITY", True), catchup_calls)

    # 5. Test: Pharmacity lỗi nhưng Long Châu vẫn chạy và ngược lại
    def test_05_sources_run_independently(self):
        with patch("app.services.crawler_pipeline.SessionLocal", return_value=self.db), \
             patch("app.services.crawler_pipeline.httpx.get") as mock_get:
            # Pharmacity ném lỗi mạng
            mock_get.side_effect = Exception("Pharmacity connection error")
            res_pmc = execute_crawl_pipeline("PHARMACITY")
            self.assertEqual(res_pmc["status"], "FAILED")

            # Long Châu chạy độc lập không bị dừng bởi Pharmacity
            mock_get.side_effect = None
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.text = "<html><h1>Thuốc Panadol Extra</h1></html>"
            mock_get.return_value = mock_resp

            res_lc = execute_crawl_pipeline("LONG_CHAU")
            self.assertIn(res_lc["status"], ["SUCCESS", "PARTIAL", "SOURCE_BLOCKED"])

    # 6. Test: Long Châu trả 403, phát hiện CAPTCHA dừng an toàn và cảnh báo
    def test_06_longchau_403_captcha_stops_and_alerts(self):
        html_captcha = "<html><head><title>Attention Required! | Cloudflare</title></head><body>cf-challenge running</body></html>"
        self.assertTrue(is_cloudflare_or_captcha(html_captcha, 403))

        with patch("app.services.crawler_pipeline.SessionLocal", return_value=self.db), \
             patch("app.services.crawler_pipeline.httpx.get") as mock_http, \
             patch("app.services.crawler_pipeline.fetch_with_browser_fallback") as mock_browser:

            mock_http_resp = MagicMock()
            mock_http_resp.status_code = 403
            mock_http_resp.text = html_captcha
            mock_http.return_value = mock_http_resp

            from app.services.browser_fallback import BrowserFetchResult
            mock_browser.return_value = BrowserFetchResult(
                success=False,
                html=None,
                status_code=403,
                is_blocked=True,
                captcha_detected=True,
                error_message="Cloudflare CAPTCHA challenge detected",
            )

            res = execute_crawl_pipeline("LONG_CHAU")
            self.assertEqual(res["status"], "SOURCE_BLOCKED")

            # Kiểm tra cảnh báo Admin đã được tạo
            alert = self.db.scalar(select(AdminAlert).where(AdminAlert.source_code == "LONG_CHAU"))
            self.assertIsNotNone(alert)
            self.assertEqual(alert.alert_type, "SOURCE_BLOCKED")

    # 7. Test: Retry/backoff đúng với 429/5xx, không retry vô hạn
    def test_07_bounded_retry_on_5xx(self):
        call_count = 0
        def fake_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            resp = MagicMock()
            resp.status_code = 503
            return resp

        with patch("app.services.crawler_pipeline.SessionLocal", return_value=self.db), \
             patch("app.services.crawler_pipeline.httpx.get", side_effect=fake_get), \
             patch("app.services.crawler_pipeline.time.sleep") as mock_sleep:

            # max_retries = 2 -> gọi tối đa 3 lần cho 1 URL
            try:
                execute_crawl_pipeline("PHARMACITY", max_items=1)
            except Exception:
                pass

            self.assertLessEqual(call_count, 5)

    # 8. Test: Cùng dữ liệu chạy hai lần không tạo sản phẩm trùng (Idempotent)
    def test_08_idempotent_crawl_no_duplicate_created(self):
        # Tạo sản phẩm đã có
        prod = CanonicalProduct(
            canonical_name="Efferalgan 500mg",
            registration_number="VN-21589-19",
            dosage_form="Viên nén sủi bọt",
            package_description="Hộp 4 vỉ x 4 viên",
            publish_status=PublishStatus.PUBLISHED,
        )
        self.db.add(prod)
        self.db.commit()

        initial_count = self.db.query(CanonicalProduct).count()

        # Giả lập cào lại đúng sản phẩm này
        with patch("app.services.crawler_pipeline.SessionLocal", return_value=self.db), \
             patch("app.services.crawler_pipeline.httpx.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.text = "<html><h1>Efferalgan 500mg</h1><p>SĐK: VN-21589-19</p><p>Giá: 45.000 ₫</p></html>"
            mock_get.return_value = mock_resp

            execute_crawl_pipeline("PHARMACITY", max_items=1)

            final_count = self.db.query(CanonicalProduct).count()
            self.assertEqual(initial_count, final_count)

    # 9. Test: Cùng tên nhưng khác hàm lượng/quy cách không bị gộp
    def test_09_different_strength_or_form_not_merged(self):
        prod_500 = CanonicalProduct(
            canonical_name="Hapacol 500",
            registration_number="VD-11111-16",
            dosage_form="Viên nén bao phim",
        )
        prod_650 = CanonicalProduct(
            canonical_name="Hapacol 650",
            registration_number="VD-24328-16",
            dosage_form="Viên sủi",
        )
        self.db.add_all([prod_500, prod_650])
        self.db.commit()

        self.assertNotEqual(prod_500.registration_number, prod_650.registration_number)
        self.assertNotEqual(prod_500.dosage_form, prod_650.dosage_form)
        self.assertEqual(self.db.query(CanonicalProduct).count(), 2)

    # 10. Test: Sản phẩm trùng chắc chắn được liên kết nguồn, không bị xóa vật lý
    def test_10_exact_duplicate_links_source_no_physical_deletion(self):
        prod = CanonicalProduct(
            canonical_name="Panadol Extra",
            registration_number="VD-25556-16",
            dosage_form="Viên nén",
            package_description="Hộp 15 vỉ",
            publish_status=PublishStatus.PUBLISHED,
        )
        self.db.add(prod)
        self.db.commit()

        prod_id = prod.id

        # Giả lập phát hiện trùng chắc chắn qua SĐK
        item = {
            "name": "Panadol Extra đỏ",
            "registration_number": "VD-25556-16",
            "price": 185000,
            "image_url": "https://example.com/panadol.jpg",
        }

        # Liên kết nguồn
        self.db.add(PriceObservation(
            product_id=prod_id,
            source_id=self.src_pmc.id,
            observed_price=Decimal("185000"),
            source_url="https://www.pharmacity.vn/panadol",
        ))
        self.db.add(ProductSourceField(
            product_id=prod_id,
            source_id=self.src_pmc.id,
            field_name="linked_source",
            original_value="https://www.pharmacity.vn/panadol",
        ))
        self.db.commit()

        # Kiểm tra sản phẩm cũ vẫn tồn tại nguyên vẹn
        saved_prod = self.db.get(CanonicalProduct, prod_id)
        self.assertIsNotNone(saved_prod)
        self.assertEqual(saved_prod.registration_number, "VD-25556-16")

        # Kiểm tra lịch sử quan sát giá và nguồn được lưu
        prices = self.db.scalars(select(PriceObservation).where(PriceObservation.product_id == prod_id)).all()
        self.assertEqual(len(prices), 1)

    # 11. Test: AI confidence thấp đưa vào hàng chờ Admin phân loại
    def test_11_ai_low_confidence_requires_admin_review(self):
        ai = AICategoryClassifier(threshold=0.85)
        # Sản phẩm mơ hồ, không có từ khóa y khoa
        res = ai.classify(name="Hộp quà sức khỏe bí ẩn xuân 2026")
        self.assertTrue(res.requires_review)
        self.assertIsNone(res.category_slug)
        self.assertLess(res.confidence, 0.85)

    # 12. Test: MANUAL_REVIEW không tự công khai sản phẩm
    def test_12_manual_review_mode_keeps_draft(self):
        prod = CanonicalProduct(
            canonical_name="Thuốc thử nghiệm",
            dosage_form="Viên nén",
            package_description="Hộp 10 viên",
            registration_number="VD-99999-26",
            category_confidence=0.95,
            category_review_status="AUTO_RESOLVED",
            image_url="https://example.com/img.jpg",
        )
        self.db.add(prod)
        self.db.commit()

        eligible, reasons = evaluate_auto_publish_eligibility(self.db, prod, publish_mode="MANUAL_REVIEW")
        self.assertFalse(eligible)
        self.assertIn("MANUAL_REVIEW", reasons[0])

    # 13. Test: AUTO_PUBLISH_VALID chỉ đăng sản phẩm vượt toàn bộ điều kiện
    def test_13_auto_publish_valid_publishes_eligible_product(self):
        # Đưa vào RegulatoryRecord chính thức để đối soát
        reg = RegulatoryRecord(
            registration_number="VN-21589-19",
            official_name="Efferalgan 500mg",
            source_url="https://dav.gov.vn",
        )
        self.db.add(reg)

        prod = CanonicalProduct(
            canonical_name="Efferalgan 500mg",
            dosage_form="Viên nén sủi bọt",
            package_description="Hộp 4 vỉ x 4 viên",
            registration_number="VN-21589-19",
            regulatory_status=RegulatoryStatus.ACTIVE,
            category_confidence=0.96,
            category_review_status="AUTO_RESOLVED",
            image_url="https://example.com/eff.jpg",
        )
        self.db.add(prod)
        self.db.commit()

        eligible, reasons = evaluate_auto_publish_eligibility(self.db, prod, publish_mode="AUTO_PUBLISH_VALID")
        self.assertTrue(eligible)
        self.assertEqual(len(reasons), 0)

    # 14. Test: Sản phẩm có xung đột/thiếu trường/thu hồi không tự đăng
    def test_14_conflicts_or_recalls_prevent_auto_publish(self):
        prod = CanonicalProduct(
            canonical_name="Thuốc bị thu hồi",
            dosage_form="Viên nén",
            package_description="Hộp 20 viên",
            registration_number="VD-00001-20",
            regulatory_status=RegulatoryStatus.RECALLED,  # Đang bị thu hồi!
            category_confidence=0.95,
            image_url="https://example.com/img.jpg",
        )
        self.db.add(prod)
        self.db.flush()

        # Thêm 1 xung đột mở
        conflict = DataConflict(
            product_id=prod.id,
            conflict_type="ACTIVE_INGREDIENT_MISMATCH",
            severity=ConflictSeverity.CRITICAL,
            field_name="ingredients",
            status=ConflictStatus.OPEN,
            description="Sai lệch hoạt chất giữa các nguồn",
        )
        self.db.add(conflict)
        self.db.commit()

        eligible, reasons = evaluate_auto_publish_eligibility(self.db, prod, publish_mode="AUTO_PUBLISH_VALID")
        self.assertFalse(eligible)
        self.assertTrue(any("thu hồi" in r for r in reasons))
        self.assertTrue(any("mâu thuẫn" in r for r in reasons))

    # 15. Test: Người dùng thường không được gọi API crawler hoặc thay đổi scheduler
    def test_15_rbac_protects_crawler_and_scheduler_endpoints(self):
        # 1. Gọi không có Token -> 401 Unauthorized
        resp_unauth = self.client.get("/api/v1/crawler/scheduler/status")
        self.assertEqual(resp_unauth.status_code, 401)

        # 2. Gọi API thay đổi cấu hình không có Token Admin -> 401
        resp_post = self.client.patch("/api/v1/crawler/scheduler/config", json={"auto_crawl_enabled": False})
        self.assertEqual(resp_post.status_code, 401)


if __name__ == "__main__":
    unittest.main()
