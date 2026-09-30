from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    CanonicalProduct,
    DataConflict,
    DataSource,
    Ingredient,
    ProductIngredient,
    ProductSourceField,
    RegulatoryRecord,
    User,
)
from app.models.enums import (
    ConflictSeverity,
    PublishStatus,
    RegulatoryStatus,
    RxOtcStatus,
    SourceType,
    UserRole,
)
from app.services.scoring import calculate_product_score


DEMO_USERS = [
    ("admin@pharmatrust.vn", "Admin@123456", "Quản trị viên", UserRole.ADMIN),
    ("reviewer@pharmatrust.vn", "Reviewer@123456", "Người kiểm tra dữ liệu", UserRole.DATA_REVIEWER),
    ("viewer@pharmatrust.vn", "Viewer@123456", "Người xem", UserRole.VIEWER),
]


def seed_users(db):
    for email, password, name, role in DEMO_USERS:
        if not db.scalar(select(User.id).where(User.email == email)):
            db.add(User(email=email, password_hash=hash_password(password), full_name=name, role=role))


REAL_SOURCES = [
    (
        "DAV_CONGBOTHUOC",
        "Cục Quản lý Dược Việt Nam (DAV - Công Bố Thuốc)",
        SourceType.REGULATORY,
        5,
        1.0,
        "https://dichvucong.dav.gov.vn/congbothuoc/index",
        "Cơ sở dữ liệu giấy phép lưu hành thuốc chính thức tại Việt Nam.",
    ),
    (
        "DRUGBANK_VN",
        "Ngân hàng Dữ liệu Dược Quốc gia (DrugBank VN)",
        SourceType.REGULATORY,
        5,
        1.0,
        "https://drugbank.vn",
        "Ngân hàng dữ liệu ngành Dược do Cục Quản lý Dược phát hành.",
    ),
    (
        "PHARMACITY",
        "Chuỗi Nhà thuốc Pharmacity",
        SourceType.RETAILER,
        2,
        0.6,
        "https://www.pharmacity.vn",
        "Dữ liệu danh mục sản phẩm từ hệ thống nhà thuốc Pharmacity.",
    ),
    (
        "LONG_CHAU",
        "Chuỗi Nhà thuốc FPT Long Châu",
        SourceType.RETAILER,
        2,
        0.6,
        "https://nhathuoclongchau.com.vn",
        "Dữ liệu danh mục sản phẩm từ hệ thống nhà thuốc Long Châu.",
    ),
    (
        "MANUAL_IMPORT",
        "Nhập tệp dữ liệu thuốc thật (CSV / Excel / PDF)",
        SourceType.MANUAL_UPLOAD,
        4,
        0.85,
        None,
        "Dữ liệu thuốc chính thức do quản trị viên tải lên từ tệp.",
    ),
]


def seed_sources(db):
    for code, name, source_type, level, weight, base_url, note in REAL_SOURCES:
        existing = db.scalar(select(DataSource).where(DataSource.code == code))
        if not existing:
            db.add(
                DataSource(
                    code=code,
                    name=name,
                    source_type=source_type,
                    authority_level=level,
                    authority_weight=weight,
                    base_url=base_url,
                    enabled=True,
                    robots_status="ALLOWED" if base_url else "NOT_APPLICABLE",
                    terms_note=note,
                )
            )
    db.flush()


def seed_demo_products(db):
    if db.scalar(select(CanonicalProduct.id).where(CanonicalProduct.is_demo.is_(True))):
        return
    official_source = db.scalar(select(DataSource).where(DataSource.code == "DAV_DEMO"))
    manufacturer_source = db.scalar(select(DataSource).where(DataSource.code == "MFR_DEMO"))
    retailer_source = db.scalar(select(DataSource).where(DataSource.code == "RETAIL_DEMO"))
    ingredient = Ingredient(normalized_name="Hoạt chất minh họa A", alternative_names=["Demo active A"])
    db.add(ingredient)
    db.flush()

    for number in range(1, 21):
        registration = None if 6 <= number <= 8 else f"DEMO-VD-{number:04d}-26"
        manufacturer = "Công ty Dược Demo Việt Nam"
        regulatory_status = RegulatoryStatus.RECALLED if number in {14, 15} else RegulatoryStatus.ACTIVE
        complete = number not in {18, 19, 20}
        product = CanonicalProduct(
            canonical_name=f"DemoMed {number:03d}" if number != 17 else "DemoMed 016 Plus",
            registration_number=registration,
            dosage_form="Viên nén" if complete else None,
            route="Đường uống" if complete else None,
            manufacturer=("Nhà sản xuất quan sát khác" if number in {12, 13} else manufacturer),
            manufacturing_country="Việt Nam" if complete else None,
            package_description="Hộp 10 vỉ x 10 viên" if complete else None,
            regulatory_status=regulatory_status,
            rx_otc_status=RxOtcStatus.OTC if number <= 17 else RxOtcStatus.UNKNOWN,
            publish_status=PublishStatus.DRAFT,
            is_demo=True,
        )
        db.add(product)
        db.flush()
        strength = 50.0 if number in {9, 10, 11} else 500.0
        db.add(
            ProductIngredient(
                product_id=product.id,
                ingredient_id=ingredient.id,
                strength_value=strength,
                strength_unit="mg",
                original_strength_text=f"{strength:g} mg",
            )
        )

        if registration:
            db.add(
                RegulatoryRecord(
                    registration_number=registration,
                    official_name=product.canonical_name,
                    manufacturer=manufacturer,
                    ingredients_json=[{"name": ingredient.normalized_name, "strength_value": 500.0, "strength_unit": "mg"}],
                    dosage_form="Viên nén",
                    package_description="Hộp 10 vỉ x 10 viên",
                    rx_otc_status=RxOtcStatus.OTC if number <= 17 else RxOtcStatus.UNKNOWN,
                    regulatory_status=regulatory_status,
                    source_url=f"demo://regulatory/{registration}",
                )
            )

        for source, field_name, value, confidence in [
            (official_source, "registration_number", registration, 1.0),
            (official_source, "ingredient_strength", "Hoạt chất minh họa A 500 mg", 1.0),
            (manufacturer_source, "manufacturer", manufacturer, 0.9),
            (retailer_source, "package_description", "Hộp 10 vỉ x 10 viên", 0.65),
        ]:
            if value:
                db.add(
                    ProductSourceField(
                        product_id=product.id,
                        source_id=source.id,
                        field_name=field_name,
                        original_value=value,
                        normalized_value=value,
                        field_confidence=confidence,
                        is_selected_value=True,
                    )
                )

        if number in {9, 10, 11}:
            db.add(
                DataConflict(
                    product_id=product.id,
                    conflict_type="STRENGTH_CONFLICT",
                    severity=ConflictSeverity.CRITICAL,
                    field_name="ingredient_strength",
                    source_a_id=official_source.id,
                    value_a="500 mg",
                    source_b_id=retailer_source.id,
                    value_b="50 mg",
                    description="Hàm lượng quan sát không khớp nguồn chính thức.",
                    detected_by="DEMO_RULE_ENGINE",
                )
            )
        if number in {12, 13}:
            db.add(
                DataConflict(
                    product_id=product.id,
                    conflict_type="MANUFACTURER_CONFLICT",
                    severity=ConflictSeverity.MEDIUM,
                    field_name="manufacturer",
                    source_a_id=official_source.id,
                    value_a=manufacturer,
                    source_b_id=retailer_source.id,
                    value_b=product.manufacturer,
                    description="Tên nhà sản xuất giữa hai nguồn không đồng nhất.",
                    detected_by="DEMO_RULE_ENGINE",
                )
            )
        db.flush()

    db.flush()
    products = db.scalars(select(CanonicalProduct).where(CanonicalProduct.is_demo.is_(True))).all()
    for product in products:
        calculate_product_score(db, product, "Khởi tạo bộ dữ liệu demo")


def main():
    import os
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        seed_users(db)
        seed_sources(db)
        db.commit()
        if os.environ.get("SEED_DEMO") == "1":
            seed_demo_products(db)
            db.commit()
            print("Đã tạo dữ liệu demo PharmaTrust.")
        else:
            print("Đã khởi tạo hệ thống PharmaTrust với các nguồn dữ liệu thật.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
