"""Seed script: Kho, Chi nhánh, Nhà cung cấp, Địa giới hành chính, SKU, Lô hàng (Hạn mới/Cận hạn/Hết hạn), Tồn kho và Chiến dịch bệnh theo mùa.
"""
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
import sys
import os

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models import (
    AdministrativeUnit,
    CanonicalProduct,
    InventoryBatch,
    PriceObservation,
    ProductSku,
    SeasonalCampaign,
    StockMovement,
    StockReceipt,
    StockReceiptItem,
    Supplier,
    Warehouse,
    WarehouseBatchStock,
    WarehouseLocation,
)


def seed_inventory():
    db = SessionLocal()
    try:
        print("[1/6] Seeding Warehouses & Locations...")
        wh_hcm = db.query(Warehouse).filter_by(code="KHO-HCM-01").first()
        if not wh_hcm:
            wh_hcm = Warehouse(
                code="KHO-HCM-01",
                name="Kho Trung Tâm Miền Nam (TP. Hồ Chí Minh)",
                address="Số 12 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                ward="Phường Bến Nghé",
                district="Quận 1",
                province="Thành phố Hồ Chí Minh",
                lat=10.7872,
                lng=106.7001,
                is_active=True,
                is_central=True,
                phone="028.3822.9988",
            )
            db.add(wh_hcm)
            db.flush()

            locs_hcm = [
                WarehouseLocation(warehouse_id=wh_hcm.id, code="HCM-A1-S1-B01", name="Kệ Dược phẩm Giảm đau Hạ sốt", aisle="A1", shelf="S1", bin="B01"),
                WarehouseLocation(warehouse_id=wh_hcm.id, code="HCM-A1-S1-B02", name="Kệ Dược phẩm Kháng sinh", aisle="A1", shelf="S1", bin="B02"),
                WarehouseLocation(warehouse_id=wh_hcm.id, code="HCM-B1-S2-B01", name="Kệ Vitamin & TPCN", aisle="B1", shelf="S2", bin="B01"),
                WarehouseLocation(warehouse_id=wh_hcm.id, code="HCM-C1-S1-B01", name="Khu vực Cách ly & Hàng cận hạn", aisle="C1", shelf="S1", bin="B01"),
            ]
            db.add_all(locs_hcm)

        wh_hn = db.query(Warehouse).filter_by(code="KHO-HN-01").first()
        if not wh_hn:
            wh_hn = Warehouse(
                code="KHO-HN-01",
                name="Kho Chi Nhánh Miền Bắc (Hà Nội)",
                address="Số 45 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội",
                ward="Phường Tràng Tiền",
                district="Quận Hoàn Kiếm",
                province="Thành phố Hà Nội",
                lat=21.0253,
                lng=105.8552,
                is_active=True,
                is_central=False,
                phone="024.3933.8866",
            )
            db.add(wh_hn)
            db.flush()

            locs_hn = [
                WarehouseLocation(warehouse_id=wh_hn.id, code="HN-A1-S1-B01", name="Kệ Thuốc Thiết yếu HN", aisle="A1", shelf="S1", bin="B01"),
                WarehouseLocation(warehouse_id=wh_hn.id, code="HN-B1-S1-B01", name="Kệ Tiêu hóa & Dạ dày HN", aisle="B1", shelf="S1", bin="B01"),
                WarehouseLocation(warehouse_id=wh_hn.id, code="HN-C1-S1-B01", name="Khu vực Cách ly HN", aisle="C1", shelf="S1", bin="B01"),
            ]
            db.add_all(locs_hn)

        db.commit()

        print("[2/6] Seeding Suppliers...")
        suppliers_data = [
            {
                "code": "NCC-DHG",
                "name": "Công ty Cổ phần Dược Hậu Giang (DHG Pharma)",
                "tax_code": "1800156801",
                "phone": "0292.3891433",
                "email": "dhgpharma@dhgpharma.com.vn",
                "address": "288 Bis Nguyễn Văn Cừ, P. An Hòa, Q. Ninh Kiều, Cần Thơ",
                "gsp_license_number": "GSP-0012/BYT-QLD",
            },
            {
                "code": "NCC-SANOFI",
                "name": "Công ty TNHH Sanofi-Aventis Việt Nam",
                "tax_code": "0302720979",
                "phone": "028.38298526",
                "email": "contact.vietnam@sanofi.com",
                "address": "Lô I-8-1, Đường D8, Khu Công nghệ Cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP. HCM",
                "gsp_license_number": "GSP-0088/BYT-QLD",
            },
            {
                "code": "NCC-GSK",
                "name": "Văn phòng Đại diện GlaxoSmithKline Pte Ltd (GSK)",
                "tax_code": "0101034455",
                "phone": "028.38241416",
                "email": "vn.safety@gsk.com",
                "address": "Tầng 16, Tòa nhà Metropolitan, 235 Đồng Khởi, Q. 1, TP. HCM",
                "gsp_license_number": "GDP-0045/BYT-QLD",
            },
        ]
        sup_map = {}
        for sdata in suppliers_data:
            sup = db.query(Supplier).filter_by(code=sdata["code"]).first()
            if not sup:
                sup = Supplier(**sdata)
                db.add(sup)
                db.flush()
            sup_map[sdata["code"]] = sup
        db.commit()

        print("[3/6] Seeding Administrative Units...")
        admin_data = [
            # Tỉnh/Thành phố
            ("79", "Thành phố Hồ Chí Minh", None, "PROVINCE", "Thành phố Hồ Chí Minh"),
            ("01", "Thành phố Hà Nội", None, "PROVINCE", "Thành phố Hà Nội"),
            ("48", "Thành phố Đà Nẵng", None, "PROVINCE", "Thành phố Đà Nẵng"),
            ("92", "Thành phố Cần Thơ", None, "PROVINCE", "Thành phố Cần Thơ"),
            ("31", "Thành phố Hải Phòng", None, "PROVINCE", "Thành phố Hải Phòng"),
            # Quận/Huyện HCM
            ("760", "Quận 1", "79", "DISTRICT", "Quận 1, TP. Hồ Chí Minh"),
            ("761", "Quận 12", "79", "DISTRICT", "Quận 12, TP. Hồ Chí Minh"),
            ("769", "TP. Thủ Đức", "79", "DISTRICT", "Thành phố Thủ Đức, TP. Hồ Chí Minh"),
            ("770", "Quận 3", "79", "DISTRICT", "Quận 3, TP. Hồ Chí Minh"),
            ("771", "Quận 10", "79", "DISTRICT", "Quận 10, TP. Hồ Chí Minh"),
            ("765", "Quận Bình Thạnh", "79", "DISTRICT", "Quận Bình Thạnh, TP. Hồ Chí Minh"),
            # Phường Q1 HCM
            ("26734", "Phường Bến Nghé", "760", "WARD", "Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"),
            ("26737", "Phường Bến Thành", "760", "WARD", "Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"),
            ("26740", "Phường Cầu Kho", "760", "WARD", "Phường Cầu Kho, Quận 1, TP. Hồ Chí Minh"),
            ("26743", "Phường Cầu Ông Lãnh", "760", "WARD", "Phường Cầu Ông Lãnh, Quận 1, TP. Hồ Chí Minh"),
            ("26746", "Phường Cô Giang", "760", "WARD", "Phường Cô Giang, Quận 1, TP. Hồ Chí Minh"),
            ("26749", "Phường Đa Kao", "760", "WARD", "Phường Đa Kao, Quận 1, TP. Hồ Chí Minh"),
            ("26752", "Phường Nguyễn Thái Bình", "760", "WARD", "Phường Nguyễn Thái Bình, Quận 1, TP. Hồ Chí Minh"),
            ("26755", "Phường Nguyễn Cư Trinh", "760", "WARD", "Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh"),
            ("26758", "Phường Phạm Ngũ Lão", "760", "WARD", "Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh"),
            ("26761", "Phường Tân Định", "760", "WARD", "Phường Tân Định, Quận 1, TP. Hồ Chí Minh"),
            # Quận/Huyện Hà Nội
            ("001", "Quận Ba Đình", "01", "DISTRICT", "Quận Ba Đình, TP. Hà Nội"),
            ("002", "Quận Hoàn Kiếm", "01", "DISTRICT", "Quận Hoàn Kiếm, TP. Hà Nội"),
            ("004", "Quận Đống Đa", "01", "DISTRICT", "Quận Đống Đa, TP. Hà Nội"),
            ("005", "Quận Hai Bà Trưng", "01", "DISTRICT", "Quận Hai Bà Trưng, TP. Hà Nội"),
            ("009", "Quận Cầu Giấy", "01", "DISTRICT", "Quận Cầu Giấy, TP. Hà Nội"),
            # Phường Hoàn Kiếm Hà Nội
            ("00037", "Phường Tràng Tiền", "002", "WARD", "Phường Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội"),
            ("00040", "Phường Lý Thái Tổ", "002", "WARD", "Phường Lý Thái Tổ, Quận Hoàn Kiếm, TP. Hà Nội"),
            ("00043", "Phường Phan Chu Trinh", "002", "WARD", "Phường Phan Chu Trinh, Quận Hoàn Kiếm, TP. Hà Nội"),
            ("00046", "Phường Hàng Bạc", "002", "WARD", "Phường Hàng Bạc, Quận Hoàn Kiếm, TP. Hà Nội"),
            ("00049", "Phường Hàng Bài", "002", "WARD", "Phường Hàng Bài, Quận Hoàn Kiếm, TP. Hà Nội"),
        ]
        for code, name, parent, level, full_name in admin_data:
            existing = db.query(AdministrativeUnit).filter_by(code=code).first()
            if not existing:
                db.add(AdministrativeUnit(code=code, name=name, parent_code=parent, level=level, full_name=full_name))
        db.commit()

        print("[4/6] Seeding Product SKUs...")
        # Check all published canonical products and create default SKUs
        published_products = db.query(CanonicalProduct).filter_by(publish_status="PUBLISHED").all()
        sku_map = {}
        for p in published_products:
            sku = db.query(ProductSku).filter_by(canonical_product_id=p.id, is_default=True).first()
            if not sku:
                # Find price from PriceObservation
                price_obs = db.query(PriceObservation).filter_by(product_id=p.id).first()
                base_price = Decimal(str(price_obs.observed_price)) if (price_obs and price_obs.observed_price) else Decimal("50000.0")
                sku_code = f"SKU-{p.registration_number or f'PT{p.id:04d}'}-BOX"
                sku = ProductSku(
                    canonical_product_id=p.id,
                    sku_code=sku_code,
                    barcode=f"893{p.id:09d}",
                    uom=p.dosage_form or "Hộp",
                    conversion_rate=1,
                    base_price=base_price,
                    is_default=True,
                    is_active=True,
                )
                db.add(sku)
                db.flush()
            sku_map[p.id] = sku
        db.commit()

        print("[5/6] Seeding Batches (Fresh, Near Expiry, Expired) & Warehouse Stock...")
        today = date.today()
        # Batch scenarios to seed for FEFO verification:
        # We need specific batches for product 17 (Panadol Extra) and product 16 (Efferalgan) if available
        wh_hcm = db.query(Warehouse).filter_by(code="KHO-HCM-01").first()
        wh_hn = db.query(Warehouse).filter_by(code="KHO-HN-01").first()

        batch_configs = [
            # Panadol Extra (ID 17)
            {
                "prod_id": 17,
                "batch_number": "LOT-PANA-2024-01",
                "mfg": today - timedelta(days=600),
                "exp": today + timedelta(days=75),  # CẬN HẠN 75 ngày
                "supplier_code": "NCC-GSK",
                "init_qty": 300,
                "status": "ACTIVE",
                "hcm_qty": 150,
                "hn_qty": 80,
            },
            {
                "prod_id": 17,
                "batch_number": "LOT-PANA-2026-02",
                "mfg": today - timedelta(days=30),
                "exp": today + timedelta(days=730),  # HẠN XA (Fresh 24 tháng)
                "supplier_code": "NCC-GSK",
                "init_qty": 1000,
                "status": "ACTIVE",
                "hcm_qty": 500,
                "hn_qty": 300,
            },
            {
                "prod_id": 17,
                "batch_number": "LOT-PANA-2023-EX",
                "mfg": today - timedelta(days=800),
                "exp": today - timedelta(days=20),  # HẾT HẠN (20 ngày trước)
                "supplier_code": "NCC-GSK",
                "init_qty": 50,
                "status": "EXPIRED",
                "hcm_qty": 10,  # Lưu ở khu cách ly
                "hn_qty": 0,
            },
            # Efferalgan 500mg (ID 16)
            {
                "prod_id": 16,
                "batch_number": "LOT-EFF-2024-A",
                "mfg": today - timedelta(days=550),
                "exp": today + timedelta(days=45),  # CẬN HẠN 45 ngày
                "supplier_code": "NCC-SANOFI",
                "init_qty": 200,
                "status": "ACTIVE",
                "hcm_qty": 100,
                "hn_qty": 50,
            },
            {
                "prod_id": 16,
                "batch_number": "LOT-EFF-2026-B",
                "mfg": today - timedelta(days=60),
                "exp": today + timedelta(days=540),  # HẠN XA 18 tháng
                "supplier_code": "NCC-SANOFI",
                "init_qty": 800,
                "status": "ACTIVE",
                "hcm_qty": 400,
                "hn_qty": 250,
            },
            # Hapacol 650 (ID 18)
            {
                "prod_id": 18,
                "batch_number": "LOT-HAPA-2026-01",
                "mfg": today - timedelta(days=45),
                "exp": today + timedelta(days=650),  # HẠN XA
                "supplier_code": "NCC-DHG",
                "init_qty": 600,
                "status": "ACTIVE",
                "hcm_qty": 300,
                "hn_qty": 200,
            },
        ]

        # Seed additional batches for all other published products so storefront has inventory
        for p in published_products:
            if p.id not in [16, 17, 18]:
                batch_configs.append({
                    "prod_id": p.id,
                    "batch_number": f"LOT-{p.registration_number or p.id}-2026",
                    "mfg": today - timedelta(days=60),
                    "exp": today + timedelta(days=540),
                    "supplier_code": "NCC-DHG" if p.id % 2 == 0 else "NCC-SANOFI",
                    "init_qty": 500,
                    "status": "ACTIVE",
                    "hcm_qty": 200,
                    "hn_qty": 150,
                })

        for cfg in batch_configs:
            sku = sku_map.get(cfg["prod_id"])
            if not sku:
                continue

            batch = db.query(InventoryBatch).filter_by(sku_id=sku.id, batch_number=cfg["batch_number"]).first()
            sup = sup_map.get(cfg["supplier_code"])
            if not batch:
                batch = InventoryBatch(
                    sku_id=sku.id,
                    batch_number=cfg["batch_number"],
                    manufacture_date=cfg["mfg"],
                    expiry_date=cfg["exp"],
                    supplier_id=sup.id if sup else None,
                    initial_quantity=cfg["init_qty"],
                    status=cfg["status"],
                    certificate_url="https://pharmatrust.vn/coa/sample-coa.pdf",
                )
                db.add(batch)
                db.flush()

            # Stock in HCM
            if cfg["hcm_qty"] > 0:
                hcm_stock = db.query(WarehouseBatchStock).filter_by(warehouse_id=wh_hcm.id, batch_id=batch.id).first()
                if not hcm_stock:
                    hcm_stock = WarehouseBatchStock(
                        warehouse_id=wh_hcm.id,
                        batch_id=batch.id,
                        quantity_on_hand=cfg["hcm_qty"],
                        quantity_reserved=0,
                        quantity_available=cfg["hcm_qty"] if cfg["status"] == "ACTIVE" else 0,
                    )
                    db.add(hcm_stock)
                    # Ghi nhận movement RECEIPT
                    db.add(StockMovement(
                        movement_code=f"MOV-HCM-INIT-{batch.id}",
                        movement_type="RECEIPT",
                        warehouse_id=wh_hcm.id,
                        batch_id=batch.id,
                        quantity=cfg["hcm_qty"],
                        balance_after=cfg["hcm_qty"],
                        reference_type="STOCK_RECEIPT",
                        reference_id="PNK-INIT-HCM",
                        note="Khởi tạo số dư đầu kỳ kho HCM",
                    ))

            # Stock in HN
            if cfg["hn_qty"] > 0:
                hn_stock = db.query(WarehouseBatchStock).filter_by(warehouse_id=wh_hn.id, batch_id=batch.id).first()
                if not hn_stock:
                    hn_stock = WarehouseBatchStock(
                        warehouse_id=wh_hn.id,
                        batch_id=batch.id,
                        quantity_on_hand=cfg["hn_qty"],
                        quantity_reserved=0,
                        quantity_available=cfg["hn_qty"] if cfg["status"] == "ACTIVE" else 0,
                    )
                    db.add(hn_stock)
                    # Ghi nhận movement RECEIPT
                    db.add(StockMovement(
                        movement_code=f"MOV-HN-INIT-{batch.id}",
                        movement_type="RECEIPT",
                        warehouse_id=wh_hn.id,
                        batch_id=batch.id,
                        quantity=cfg["hn_qty"],
                        balance_after=cfg["hn_qty"],
                        reference_type="STOCK_RECEIPT",
                        reference_id="PNK-INIT-HN",
                        note="Khởi tạo số dư đầu kỳ kho HN",
                    ))

        db.commit()

        print("[6/6] Seeding Seasonal Campaigns...")
        campaigns_data = [
            {
                "slug": "cum-mua-dong-xuan",
                "title": "Phòng Ngừa & Chăm Sóc Cúm Mùa Đông - Xuân",
                "disease_name": "Cúm mùa & Nhiễm khuẩn đường hô hấp trên",
                "season": "DONG",
                "symptoms": "Sốt cao đột ngột, đau nhức mình mẩy, ho khan, đau họng, nghẹt mũi và mệt mỏi toàn thân.",
                "prevention": "Đeo khẩu trang nơi công cộng, giữ ấm cổ ngực, súc họng bằng nước muối sinh lý, tiêm vắc xin cúm hàng năm, bổ sung vitamin C nâng cao đề kháng.",
                "recommended_product_ids": "[16, 17, 18]",
                "status": "ACTIVE",
                "banner_image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&auto=format&fit=crop&q=80",
            },
            {
                "slug": "sot-xuat-huyet-mua-mua",
                "title": "Chủ Động Phòng Chống & Điều Trị Sốt Xuất Huyết Mùa Mưa",
                "disease_name": "Sốt xuất huyết Dengue",
                "season": "HA",
                "symptoms": "Sốt cao liên tục 2-7 ngày khó hạ, đau đầu dữ dội, đau hốc mắt, đau cơ khớp, xuất hiện chấm xuất huyết dưới da hoặc chảy máu chân răng.",
                "prevention": "Diệt lăng quăng/bọ gậy, ngủ màn cả ban ngày, mặc quần áo dài tay, sử dụng kem chống muỗi, dọn dẹp các vật dụng chứa nước đọng.",
                "recommended_product_ids": "[16, 17, 18]",
                "status": "ACTIVE",
                "banner_image_url": "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=1200&auto=format&fit=crop&q=80",
            },
            {
                "slug": "viem-mui-di-ung-giao-mua",
                "title": "Kiểm Soát Viêm Mũi Dị Ứng & Hô Hấp Giao Mùa",
                "disease_name": "Viêm mũi dị ứng thời tiết",
                "season": "THU",
                "symptoms": "Hắt hơi từng tràng liên tục khi thời tiết thay đổi, ngứa mũi mắt, chảy nước mũi trong, nghẹt mũi khó thở về đêm.",
                "prevention": "Tránh tiếp xúc khói bụi và phấn hoa, vệ sinh mũi hàng ngày bằng dung dịch xịt mũi chuyên dụng, giữ ấm phòng ngủ.",
                "recommended_product_ids": "[19]",
                "status": "ACTIVE",
                "banner_image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
            },
        ]
        for cdata in campaigns_data:
            c = db.query(SeasonalCampaign).filter_by(slug=cdata["slug"]).first()
            if not c:
                db.add(SeasonalCampaign(**cdata))
        db.commit()

        print("=== SEEDING COMPLETED SUCCESSFULLY! ===")
        print(f"Warehouses: {db.query(Warehouse).count()}")
        print(f"Locations: {db.query(WarehouseLocation).count()}")
        print(f"Suppliers: {db.query(Supplier).count()}")
        print(f"Admin Units: {db.query(AdministrativeUnit).count()}")
        print(f"Product SKUs: {db.query(ProductSku).count()}")
        print(f"Batches: {db.query(InventoryBatch).count()}")
        print(f"Warehouse Batch Stocks: {db.query(WarehouseBatchStock).count()}")
        print(f"Stock Movements: {db.query(StockMovement).count()}")
        print(f"Seasonal Campaigns: {db.query(SeasonalCampaign).count()}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_inventory()
