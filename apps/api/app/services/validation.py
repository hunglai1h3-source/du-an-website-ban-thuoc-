from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import CanonicalProduct, DataConflict, RegulatoryRecord
from app.models.enums import ConflictStatus, RegulatoryStatus


def evaluate_auto_publish_eligibility(
    db: Session,
    product: CanonicalProduct,
    publish_mode: str = "MANUAL_REVIEW",
) -> tuple[bool, list[str]]:
    """
    Đánh giá xem sản phẩm có đủ điều kiện để TỰ ĐỘNG ĐĂNG BÁN (AUTO_PUBLISH_VALID) hay không.
    Trả về (is_eligible, failure_reasons).
    Chỉ khi vượt qua 100% các điều kiện và publish_mode == 'AUTO_PUBLISH_VALID', sản phẩm mới được tự đăng.
    """
    reasons: list[str] = []

    # 1. Chế độ đăng do Admin cài đặt
    if publish_mode != "AUTO_PUBLISH_VALID":
        return False, ["Hệ thống đang hoạt động ở chế độ Duyệt thủ công (MANUAL_REVIEW). Mọi sản phẩm phải chờ Admin duyệt."]

    # 2. Kiểm tra các trường bắt buộc
    if not (product.canonical_name and product.canonical_name.strip()):
        reasons.append("Thiếu tên sản phẩm chuẩn hóa (canonical_name).")
    if not (product.dosage_form and product.dosage_form.strip()):
        reasons.append("Thiếu dạng bào chế của thuốc (dosage_form).")
    if not (product.package_description and product.package_description.strip()):
        reasons.append("Thiếu quy cách đóng gói (package_description).")

    # 3. Kiểm tra mâu thuẫn dữ liệu mở (Data Conflict)
    open_conflicts = db.scalars(
        select(DataConflict).where(
            DataConflict.product_id == product.id,
            DataConflict.status == ConflictStatus.OPEN,
        )
    ).all()
    if open_conflicts:
        conflict_types = [c.conflict_type for c in open_conflicts]
        reasons.append(f"Tồn tại {len(open_conflicts)} mâu thuẫn dữ liệu mở ({', '.join(conflict_types)}).")

    # 4. Đối chiếu số đăng ký thuốc với hồ sơ Cục Quản lý Dược (DAV / DrugBank)
    if product.registration_number:
        official_rec = db.scalar(
            select(RegulatoryRecord).where(RegulatoryRecord.registration_number == product.registration_number)
        )
        if not official_rec:
            reasons.append(f"Số đăng ký {product.registration_number} chưa đối chiếu được trong cơ sở dữ liệu cấp phép chính thức.")
    else:
        reasons.append("Sản phẩm chưa có Số đăng ký / Giấy phép lưu hành hợp lệ.")

    # 5. Kiểm tra cờ thu hồi hoặc vi phạm chất lượng
    if product.regulatory_status in {RegulatoryStatus.RECALLED, RegulatoryStatus.QUALITY_VIOLATION}:
        reasons.append(f"Thuốc đang ở trạng thái thu hồi hoặc vi phạm chất lượng ({product.regulatory_status.value}).")

    # 6. Kiểm tra giá bán và đơn vị bán
    if hasattr(product, "price") and product.price is not None:
        if product.price <= 0:
            reasons.append("Giá bán không hợp lệ (nhỏ hơn hoặc bằng 0).")
        elif product.price < 500:
            reasons.append("Giá bán quá thấp bất thường, nghi ngờ lỗi đơn vị viên/vỉ/hộp.")

    # 7. Kiểm tra phân loại danh mục AI
    cat_conf = getattr(product, "category_confidence", 0.0) or 0.0
    cat_status = getattr(product, "category_review_status", "AUTO_RESOLVED") or "AUTO_RESOLVED"
    if cat_status == "CATEGORY_REVIEW_REQUIRED" or cat_conf < settings.category_ai_threshold:
        reasons.append(f"Danh mục chưa được xác thực độ tin cậy cao (Điểm AI: {cat_conf:.2f} < ngưỡng {settings.category_ai_threshold}).")

    # 8. Kiểm tra hình ảnh hợp lệ
    if not (product.image_url and product.image_url.startswith("http")):
        reasons.append("Chưa có hình ảnh sản phẩm hợp lệ từ nguồn dữ liệu.")

    is_eligible = len(reasons) == 0
    return is_eligible, reasons
