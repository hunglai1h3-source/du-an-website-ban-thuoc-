from sqlalchemy import delete, select
from app.db.session import SessionLocal
from app.models import (
    AuditLog,
    CanonicalProduct,
    ConfidenceScore,
    CrawlRun,
    DataConflict,
    DataSource,
    Ingredient,
    PriceObservation,
    ProductCandidate,
    ProductIngredient,
    ProductSourceField,
    RawDocument,
    RegulatoryRecord,
    ReviewDecision,
    ScoreHistory,
    User,
)
from app.models.enums import SourceType

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


def reset_to_clean_state():
    db = SessionLocal()
    try:
        print("[1/3] Đang xóa toàn bộ dữ liệu thuốc mẫu (demo)...")
        db.execute(delete(ScoreHistory))
        db.execute(delete(ReviewDecision))
        db.execute(delete(ConfidenceScore))
        db.execute(delete(PriceObservation))
        db.execute(delete(DataConflict))
        db.execute(delete(ProductIngredient))
        db.execute(delete(ProductSourceField))
        db.execute(delete(CanonicalProduct))
        db.execute(delete(ProductCandidate))
        db.execute(delete(RawDocument))
        db.execute(delete(CrawlRun))
        db.execute(delete(RegulatoryRecord))
        db.execute(delete(Ingredient))
        db.execute(delete(AuditLog))
        db.commit()

        print("[2/3] Đang xóa các nguồn demo cũ...")
        demo_codes = ["DAV_DEMO", "MFR_DEMO", "RETAIL_DEMO", "MANUAL"]
        for code in demo_codes:
            source = db.scalar(select(DataSource).where(DataSource.code == code))
            if source:
                db.delete(source)
        db.commit()

        print("[3/3] Đang cấu hình các nguồn dữ liệu thật...")
        for code, name, stype, level, weight, base_url, note in REAL_SOURCES:
            existing = db.scalar(select(DataSource).where(DataSource.code == code))
            if not existing:
                db.add(
                    DataSource(
                        code=code,
                        name=name,
                        source_type=stype,
                        authority_level=level,
                        authority_weight=weight,
                        base_url=base_url,
                        enabled=True,
                        robots_status="ALLOWED" if base_url else "NOT_APPLICABLE",
                        terms_note=note,
                    )
                )
            else:
                existing.name = name
                existing.source_type = stype
                existing.authority_level = level
                existing.authority_weight = weight
                existing.base_url = base_url
                existing.enabled = True
                existing.terms_note = note
        db.commit()

        user_count = db.query(User).count()
        print(f"[OK] Đã dọn sạch dữ liệu demo. Giữ nguyên {user_count} tài khoản người dùng.")
        print("[OK] Đã cấu hình xong 5 nguồn dữ liệu thật sẵn sàng cho việc cào và nhập dữ liệu.")
    finally:
        db.close()


if __name__ == "__main__":
    reset_to_clean_state()
