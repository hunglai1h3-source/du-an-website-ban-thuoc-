from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from rapidfuzz.fuzz import ratio
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import CanonicalProduct, ConfidenceScore, DataConflict, RegulatoryRecord, ScoreHistory
from app.models.enums import (
    ConfidenceLabel,
    ConflictSeverity,
    ConflictStatus,
    PublishStatus,
    RegulatoryStatus,
    RxOtcStatus,
    SourceType,
)
from app.services.normalization import normalize_for_match, normalize_registration_number


@dataclass
class ScoringResult:
    old_score: int
    new_score: int
    label: ConfidenceLabel
    reasons: list[str]
    blocked: bool


def _ingredient_map(items: list[dict]) -> dict[str, str]:
    result = {}
    for item in items or []:
        name = normalize_for_match(str(item.get("name", "")))
        strength = f"{item.get('strength_value', item.get('value', ''))}{item.get('strength_unit', item.get('unit', ''))}".lower()
        if name:
            result[name] = strength
    return result


def calculate_product_score(db: Session, product: CanonicalProduct, reason: str = "Tính điểm tự động") -> ScoringResult:
    old_score = product.overall_score
    old_label = product.confidence_label.value
    reasons: list[str] = []
    blocked = False

    official = None
    if product.registration_number:
        official = db.scalar(
            select(RegulatoryRecord)
            .where(RegulatoryRecord.registration_number == normalize_registration_number(product.registration_number))
            .order_by(desc(RegulatoryRecord.fetched_at))
        )

    registration_score = 30 if official else 0
    if official:
        reasons.append("Khớp số đăng ký với hồ sơ chính thức")
    else:
        reasons.append("Chưa tìm thấy số đăng ký trong hồ sơ chính thức")

    otc_score = 20 if official and official.rx_otc_status == RxOtcStatus.OTC else 0
    if otc_score:
        reasons.append("Nguồn chính thức xác định thuốc OTC")

    product_ingredients = {
        normalize_for_match(item.ingredient.normalized_name): f"{item.strength_value or ''}{item.strength_unit or ''}".lower()
        for item in product.ingredients
    }
    official_ingredients = _ingredient_map(official.ingredients_json if official else [])
    ingredient_score = 20 if product_ingredients and product_ingredients == official_ingredients else 0
    if ingredient_score:
        reasons.append("Hoạt chất và hàm lượng khớp hồ sơ chính thức")

    manufacturer_score = 0
    if official and product.manufacturer and official.manufacturer:
        if ratio(normalize_for_match(product.manufacturer), normalize_for_match(official.manufacturer)) >= 90:
            manufacturer_score = 10
            reasons.append("Nhà sản xuất khớp")

    package_score = 0
    if official and product.package_description and official.package_description:
        if ratio(normalize_for_match(product.package_description), normalize_for_match(official.package_description)) >= 80:
            package_score = 5

    selected_fields = [item for item in product.source_fields if item.is_selected_value]
    distinct_sources = {item.source_id for item in selected_fields}
    consensus_score = 5 if len(distinct_sources) >= 2 else 0

    recent_cutoff = datetime.now(UTC) - timedelta(days=180)
    recency_score = 5 if any(item.observed_at and item.observed_at.replace(tzinfo=item.observed_at.tzinfo or UTC) >= recent_cutoff for item in selected_fields) else 0

    required_values = [
        product.canonical_name,
        product.registration_number,
        product.manufacturer,
        product.dosage_form,
        product.package_description,
    ]
    completeness_score = round(sum(bool(value) for value in required_values) / len(required_values) * 5)

    open_conflicts = db.scalars(
        select(DataConflict).where(
            DataConflict.product_id == product.id,
            DataConflict.status == ConflictStatus.OPEN,
        )
    ).all()
    critical_conflict = any(item.severity == ConflictSeverity.CRITICAL for item in open_conflicts)
    ingredient_conflict = any(item.conflict_type in {"INGREDIENT_CONFLICT", "STRENGTH_CONFLICT"} for item in open_conflicts)
    penalty = min(20, len(open_conflicts) * 5)

    total = max(
        0,
        registration_score + otc_score + ingredient_score + manufacturer_score + package_score + consensus_score + recency_score + completeness_score - penalty,
    )

    if not product.registration_number or not official:
        total = min(total, 40)
    if ingredient_conflict:
        total = min(total, 25)
        blocked = True
        reasons.append("Bị chặn do mâu thuẫn hoạt chất hoặc hàm lượng")
    if critical_conflict:
        blocked = True
        reasons.append("Bị chặn do có mâu thuẫn nghiêm trọng")
    if official and official.regulatory_status in {RegulatoryStatus.RECALLED, RegulatoryStatus.QUALITY_VIOLATION, RegulatoryStatus.EXPIRED}:
        total = 0
        blocked = True
        reasons.append("Bị chặn theo trạng thái quản lý chính thức")

    source_types = {item.source.source_type for item in product.source_fields if item.source}
    if source_types and source_types.issubset({SourceType.RETAILER}):
        total = min(total, 59)
        reasons.append("Chỉ có nguồn nhà bán lẻ")
    if open_conflicts and not blocked:
        total = min(total, 84)
        reasons.append("Không thể đạt nhãn khớp cao khi còn mâu thuẫn chưa xử lý")

    if blocked:
        label = ConfidenceLabel.BLOCKED
        publish_status = PublishStatus.BLOCKED
    elif total >= 85:
        label = ConfidenceLabel.HIGH_OFFICIAL_MATCH
        publish_status = PublishStatus.PUBLISHED
    elif total >= 60:
        label = ConfidenceLabel.REVIEW_REQUIRED
        publish_status = PublishStatus.REVIEW_REQUIRED
    else:
        label = ConfidenceLabel.INSUFFICIENT_EVIDENCE
        publish_status = PublishStatus.DRAFT

    score = ConfidenceScore(
        product_id=product.id,
        registration_match_score=registration_score,
        otc_status_score=otc_score,
        ingredient_strength_score=ingredient_score,
        manufacturer_score=manufacturer_score,
        package_score=package_score,
        source_consensus_score=consensus_score,
        recency_score=recency_score,
        completeness_score=completeness_score,
        penalty=penalty,
        total_score=total,
        confidence_label=label,
        scoring_rule_version="1.0",
    )
    db.add(score)
    db.add(
        ScoreHistory(
            product_id=product.id,
            old_score=old_score,
            new_score=total,
            old_label=old_label,
            new_label=label.value,
            reason=reason,
        )
    )
    product.overall_score = total
    product.confidence_label = label
    product.publish_status = publish_status
    db.flush()
    return ScoringResult(old_score=old_score, new_score=total, label=label, reasons=reasons, blocked=blocked)
