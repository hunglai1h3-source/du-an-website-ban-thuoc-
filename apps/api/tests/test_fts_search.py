import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.entities import CanonicalProduct, Ingredient, ProductIngredient
from app.models.enums import PublishStatus, RegulatoryStatus, RxOtcStatus
from app.services.search_service import (
    init_fts_table,
    index_single_product,
    search_product_ids_fts,
    _fallback_weighted_search,
)


class TestFullTextSearch(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = TestingSessionLocal()
        init_fts_table(self.db)

        # Tạo dữ liệu mẫu kiểm thử
        # 1. Panadol Extra (Chứa Paracetamol, chỉ định giảm đau hạ sốt)
        ing_para = Ingredient(id=1, normalized_name="Paracetamol")
        ing_caf = Ingredient(id=2, normalized_name="Caffeine")
        self.db.add_all([ing_para, ing_caf])
        self.db.flush()

        prod1 = CanonicalProduct(
            id=101,
            canonical_name="Panadol Extra Đỏ",
            registration_number="VN-12345-20",
            dosage_form="Viên nén bao phim",
            indications="Giảm đau từ nhẹ đến vừa và hạ sốt, đau đầu, đau nửa đầu.",
            manufacturer="GlaxoSmithKline",
            regulatory_status=RegulatoryStatus.ACTIVE,
            rx_otc_status=RxOtcStatus.OTC,
            publish_status=PublishStatus.PUBLISHED,
        )
        self.db.add(prod1)
        self.db.flush()
        self.db.add(ProductIngredient(product_id=101, ingredient_id=1, strength_value=500, strength_unit="mg"))
        self.db.add(ProductIngredient(product_id=101, ingredient_id=2, strength_value=65, strength_unit="mg"))

        # 2. Hapacol 650 (Chứa Paracetamol, chỉ định cảm sốt)
        prod2 = CanonicalProduct(
            id=102,
            canonical_name="Hapacol 650",
            registration_number="VD-99999-22",
            dosage_form="Viên nén",
            indications="Điều trị các triệu chứng đau và sốt cao trong các trường hợp cảm cúm.",
            manufacturer="DHG Pharma",
            regulatory_status=RegulatoryStatus.ACTIVE,
            rx_otc_status=RxOtcStatus.OTC,
            publish_status=PublishStatus.PUBLISHED,
        )
        self.db.add(prod2)
        self.db.flush()
        self.db.add(ProductIngredient(product_id=102, ingredient_id=1, strength_value=650, strength_unit="mg"))

        # 3. Otrivin 0.1% (Chứa Xylometazoline, điều trị nghẹt mũi viêm xoang)
        ing_xylo = Ingredient(id=3, normalized_name="Xylometazoline hydrochloride")
        self.db.add(ing_xylo)
        self.db.flush()
        prod3 = CanonicalProduct(
            id=103,
            canonical_name="Thuốc xịt mũi Otrivin 0.1% điều trị nghẹt mũi",
            registration_number="VN-18235-14",
            dosage_form="Dung dịch xịt mũi",
            indications="Giảm nghẹt mũi, sung huyết mũi trong các trường hợp cảm lạnh, viêm mũi dị ứng, viêm xoang.",
            manufacturer="GSK",
            regulatory_status=RegulatoryStatus.ACTIVE,
            rx_otc_status=RxOtcStatus.OTC,
            publish_status=PublishStatus.PUBLISHED,
        )
        self.db.add(prod3)
        self.db.flush()
        self.db.add(ProductIngredient(product_id=103, ingredient_id=3, strength_value=0.1, strength_unit="%"))

        self.db.commit()

        # Nạp chỉ mục FTS
        index_single_product(self.db, prod1)
        index_single_product(self.db, prod2)
        index_single_product(self.db, prod3)

    def tearDown(self):
        self.db.close()

    def test_01_search_unaccent_vietnamese(self):
        """Khách gõ không dấu 'ha sot' hoặc 'nghet mui' vẫn tìm chính xác."""
        res_ha_sot = search_product_ids_fts(self.db, "ha sot")
        self.assertIn(101, res_ha_sot)
        self.assertNotIn(103, res_ha_sot)

        res_mui = search_product_ids_fts(self.db, "nghet mui")
        self.assertIn(103, res_mui)
        self.assertNotIn(101, res_mui)

    def test_02_search_by_active_ingredient(self):
        """Khách tìm theo tên hoạt chất y khoa 'paracetamol' trả về cả Panadol và Hapacol."""
        results = search_product_ids_fts(self.db, "paracetamol")
        self.assertIn(101, results)
        self.assertIn(102, results)
        self.assertNotIn(103, results)

    def test_03_relevance_ranking(self):
        """Sản phẩm khớp trực tiếp tên thương mại phải xếp trên sản phẩm chỉ khớp trong chỉ định."""
        results = search_product_ids_fts(self.db, "Panadol")
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0], 101)

    def test_04_fallback_search(self):
        """Fallback search hoạt động chuẩn xác kể cả khi không dùng FTS."""
        res = _fallback_weighted_search(self.db, "viêm xoang", "viem xoang", limit=10, offset=0)
        self.assertIn(103, res)


if __name__ == "__main__":
    unittest.main()
