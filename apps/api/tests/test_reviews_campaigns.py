import json
import unittest
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models import (
    CanonicalProduct,
    DataSource,
    Order,
    OrderItem,
    PriceObservation,
    ProductSku,
    User,
    Warehouse,
)
from app.models.enums import PublishStatus, RxOtcStatus, SourceType, UserRole
from app.models.inventory import ProductReview, SeasonalCampaign
from app.api.reviews import (
    CreateReviewRequest,
    UpdateReviewStatusRequest,
    get_product_reviews,
    submit_product_review,
    admin_list_reviews,
    admin_toggle_review_status,
    admin_delete_review,
)
from app.api.campaigns import (
    SeasonalCampaignCreateRequest,
    SeasonalCampaignUpdateRequest,
    get_active_campaigns,
    get_campaign_by_slug,
    admin_list_campaigns,
    admin_create_campaign,
    admin_update_campaign,
    admin_toggle_campaign_status,
    admin_delete_campaign,
)


class TestReviewsAndCampaignsSuite(unittest.TestCase):
    def setUp(self):
        # Database in-memory SQLite riêng biệt cho từng test case
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        # Seed Admin User
        self.admin = User(
            email="admin@pharmatrust.vn",
            full_name="Quản Trị Viên",
            password_hash="hashed_pw_dummy",
            role=UserRole.ADMIN,
            is_active=True,
        )
        self.db.add(self.admin)

        # Seed Warehouse
        self.wh = Warehouse(
            code="KHO-01",
            name="Kho Dược Cần Thơ",
            address="123 Ba Tháng Hai",
            province="92",
            district="916",
            lat=10.0333,
            lng=105.7833,
            is_active=True,
        )
        self.db.add(self.wh)
        self.db.flush()

        # Seed Canonical Products
        self.prod1 = CanonicalProduct(
            id=101,
            canonical_name="Hapacol 250mg Hương Cam",
            registration_number="VD-21345-14",
            publish_status=PublishStatus.PUBLISHED,
            rx_otc_status=RxOtcStatus.OTC,
            dosage_form="Gói bột sủi",
            description="Hạ sốt, giảm đau cho trẻ nhỏ.",
        )
        self.prod2 = CanonicalProduct(
            id=102,
            canonical_name="Berocca Viên Sủi Tăng Đề Kháng",
            registration_number="VN-54321-18",
            publish_status=PublishStatus.PUBLISHED,
            rx_otc_status=RxOtcStatus.OTC,
            dosage_form="Viên sủi",
            description="Bổ sung Vitamin B & C.",
        )
        self.db.add_all([self.prod1, self.prod2])
        self.db.flush()

        # Seed DataSource
        self.ds = DataSource(
            code="SRC-INTERNAL",
            name="Nguồn nội bộ PharmaTrust",
            source_type=SourceType.MANUAL_UPLOAD,
        )
        self.db.add(self.ds)
        self.db.flush()

        # Seed Price
        self.price1 = PriceObservation(
            product_id=self.prod1.id,
            source_id=self.ds.id,
            source_url="https://pharmatrust.vn/products/101",
            observed_price=Decimal("45000"),
            observed_at=datetime.now(timezone.utc),
        )
        self.db.add(self.price1)

        # Seed SKU & Order for verification
        self.sku1 = ProductSku(
            canonical_product_id=self.prod1.id,
            sku_code="SKU-HAPACOL-250",
            uom="Hộp",
            base_price=Decimal("45000"),
            is_active=True,
        )
        self.db.add(self.sku1)
        self.db.flush()

        self.order = Order(
            order_code="ORD-VERIFIED-9999",
            customer_name="Trần Văn Khách",
            customer_phone="0912345678",
            shipping_address="123 Ba Tháng Hai, Cần Thơ",
            total_amount=Decimal("90000"),
            shipping_fee=Decimal("15000"),
            order_status="COMPLETED",
        )
        self.db.add(self.order)
        self.db.flush()

        self.order_item = OrderItem(
            order_id=self.order.id,
            product_id=self.prod1.id,
            product_name=self.prod1.canonical_name,
            product_sku=self.sku1.sku_code,
            quantity=2,
            price=Decimal("45000"),
            subtotal=Decimal("90000"),
        )
        self.db.add(self.order_item)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    # =========================================================================
    # REVIEWS TESTS
    # =========================================================================

    def test_review_summary_and_distribution(self):
        # Tạo 2 đánh giá cho sản phẩm 1: 1 cái 5 sao và 1 cái 4 sao
        r1 = ProductReview(
            canonical_product_id=self.prod1.id,
            customer_name="Khách Hàng A",
            rating=5,
            comment="Thuốc dùng rất tốt",
            is_verified_purchase=True,
            is_approved=True,
        )
        r2 = ProductReview(
            canonical_product_id=self.prod1.id,
            customer_name="Khách Hàng B",
            rating=4,
            comment="Giao hàng hơi lâu xíu",
            is_verified_purchase=False,
            is_approved=True,
        )
        # 1 đánh giá chưa duyệt (is_approved=False) -> không được tính
        r3 = ProductReview(
            canonical_product_id=self.prod1.id,
            customer_name="Khách Spam",
            rating=1,
            comment="Nội dung spam quảng cáo",
            is_verified_purchase=False,
            is_approved=False,
        )
        self.db.add_all([r1, r2, r3])
        self.db.commit()

        summary = get_product_reviews(product_id=self.prod1.id, db=self.db)
        self.assertEqual(summary.total_reviews, 2)
        self.assertEqual(summary.average_rating, 4.5)
        self.assertEqual(summary.verified_reviews_count, 1)
        self.assertEqual(summary.rating_distribution[5], 1)
        self.assertEqual(summary.rating_distribution[4], 1)
        self.assertEqual(summary.rating_distribution[1], 0)
        self.assertEqual(len(summary.reviews), 2)

    def test_submit_verified_review_with_order_code(self):
        req = CreateReviewRequest(
            rating=5,
            customer_name="Trần Văn Khách",
            comment="Đã mua hàng và nhận được sản phẩm chính hãng rất tốt",
            order_code="ORD-VERIFIED-9999",
        )
        res = submit_product_review(product_id=self.prod1.id, payload=req, db=self.db)
        self.assertTrue(res.is_verified_purchase)
        self.assertEqual(res.order_code, "ORD-VERIFIED-9999")
        self.assertEqual(res.rating, 5)

    def test_submit_unverified_review_with_invalid_order_code(self):
        req = CreateReviewRequest(
            rating=4,
            customer_name="Người Dùng Vãng Lai",
            comment="Chưa mua trên web nhưng thấy thành phần rất ổn",
            order_code="ORD-NON-EXISTENT",
        )
        res = submit_product_review(product_id=self.prod1.id, payload=req, db=self.db)
        self.assertFalse(res.is_verified_purchase)
        self.assertIsNone(res.order_code)

    def test_admin_review_moderation(self):
        # Submit review
        req = CreateReviewRequest(
            rating=3,
            customer_name="Nguyễn Văn C",
            comment="Sản phẩm bình thường",
        )
        created = submit_product_review(product_id=self.prod1.id, payload=req, db=self.db)

        # Admin lists all reviews
        admin_list = admin_list_reviews(db=self.db, current_user=self.admin)
        self.assertGreaterEqual(len(admin_list), 1)

        # Admin toggles to False (Hide review)
        admin_toggle_review_status(
            review_id=created.id,
            payload=UpdateReviewStatusRequest(is_approved=False),
            db=self.db,
            current_user=self.admin,
        )

        # Storefront should no longer see it
        store_res = get_product_reviews(product_id=self.prod1.id, db=self.db)
        self.assertEqual(store_res.total_reviews, 0)

        # Admin permanently deletes review
        del_res = admin_delete_review(review_id=created.id, db=self.db, current_user=self.admin)
        self.assertTrue(del_res["success"])
        self.assertIsNone(self.db.query(ProductReview).filter_by(id=created.id).first())

    # =========================================================================
    # CAMPAIGNS TESTS
    # =========================================================================

    def test_campaign_creation_and_product_resolution(self):
        # Admin creates campaign
        create_req = SeasonalCampaignCreateRequest(
            title="Chiến Dịch Sốt Xuất Huyết Mùa Mưa",
            disease_name="Sốt Xuất Huyết Dengue",
            season="MUA_MUA",
            symptoms="Sốt cao liên tục, phát ban, đau khớp",
            prevention="Nằm màn, diệt bọ gậy, uống Paracetamol hạ sốt",
            recommended_product_ids=[self.prod1.id],
            status="ACTIVE",
        )
        campaign = admin_create_campaign(payload=create_req, db=self.db, current_user=self.admin)
        self.assertEqual(campaign.disease_name, "Sốt Xuất Huyết Dengue")
        self.assertEqual(campaign.slug, "chien-dich-sot-xuat-huyet-mua-mua")
        self.assertEqual(len(campaign.recommended_products), 1)
        self.assertEqual(campaign.recommended_products[0].name, "Hapacol 250mg Hương Cam")
        self.assertEqual(campaign.recommended_products[0].price, 45000)

        # Storefront retrieves active campaigns
        store_campaigns = get_active_campaigns(season="MUA_MUA", db=self.db)
        self.assertEqual(len(store_campaigns), 1)
        self.assertEqual(store_campaigns[0].title, "Chiến Dịch Sốt Xuất Huyết Mùa Mưa")

        # Fetch by slug
        single = get_campaign_by_slug(slug=campaign.slug, db=self.db)
        self.assertEqual(single.id, campaign.id)

    def test_campaign_status_transition_and_update(self):
        camp = SeasonalCampaign(
            slug="cam-cum-mua-dong",
            title="Phòng Cảm Cúm Mùa Đông",
            disease_name="Cảm Cúm",
            season="DONG",
            symptoms="Hắt hơi, sổ mũi",
            prevention="Giữ ấm, súc họng nước muối",
            recommended_product_ids="[]",
            status="ACTIVE",
        )
        self.db.add(camp)
        self.db.commit()

        # Pause campaign
        admin_toggle_campaign_status(campaign_id=camp.id, status="PAUSED", db=self.db, current_user=self.admin)

        # Storefront should not show PAUSED campaigns
        active_list = get_active_campaigns(db=self.db)
        self.assertEqual(len(active_list), 0)

        # Update campaign
        update_req = SeasonalCampaignUpdateRequest(
            title="Phòng Cảm Cúm & Viêm Họng Mùa Đông Mới",
            status="ACTIVE",
        )
        updated = admin_update_campaign(campaign_id=camp.id, payload=update_req, db=self.db, current_user=self.admin)
        self.assertEqual(updated.title, "Phòng Cảm Cúm & Viêm Họng Mùa Đông Mới")
        self.assertEqual(updated.status, "ACTIVE")

        # Admin delete
        del_res = admin_delete_campaign(campaign_id=camp.id, db=self.db, current_user=self.admin)
        self.assertTrue(del_res["success"])
        self.assertIsNone(self.db.query(SeasonalCampaign).filter_by(id=camp.id).first())


if __name__ == "__main__":
    unittest.main()
