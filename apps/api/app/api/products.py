from datetime import date, timedelta
import math
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.config import settings
from app.db.session import get_db
from app.models import (
    CanonicalProduct,
    DataConflict,
    InventoryBatch,
    PriceObservation,
    ProductCandidate,
    ProductIngredient,
    ProductSku,
    ReviewDecision,
    ScoreHistory,
    User,
    WarehouseBatchStock,
)
from app.models.enums import (
    ConfidenceLabel,
    ConflictStatus,
    ProcessingStatus,
    PublishStatus,
    ReviewDecisionType,
    RxOtcStatus,
    UserRole,
)
from app.schemas.products import (
    CandidateMatchRequest,
    CandidateOut,
    ConflictOut,
    ConflictResolveRequest,
    IngredientOut,
    ProductDetail,
    ProductSummary,
    ReviewCreate,
    ScoreOut,
    ScoreRecalculateResponse,
    SourceFieldOut,
)
from app.services.audit import write_audit
from app.services.scoring import calculate_product_score


router = APIRouter(tags=["Sản phẩm và kiểm chứng"])
public_router = APIRouter(prefix="/public", tags=["Public API"])


def _product_query():
    return select(CanonicalProduct).options(
        selectinload(CanonicalProduct.ingredients).selectinload(ProductIngredient.ingredient),
        selectinload(CanonicalProduct.source_fields),
        selectinload(CanonicalProduct.conflicts),
        selectinload(CanonicalProduct.scores),
    )


def _detail(product: CanonicalProduct) -> ProductDetail:
    latest_score = max(product.scores, key=lambda item: item.calculated_at) if product.scores else None
    return ProductDetail(
        id=product.id,
        canonical_name=product.canonical_name,
        registration_number=product.registration_number,
        manufacturer=product.manufacturer,
        image_url=product.image_url,
        description=product.description,
        usage_instructions=product.usage_instructions,
        indications=product.indications,
        contraindications=product.contraindications,
        side_effects=product.side_effects,
        storage_conditions=product.storage_conditions,
        rx_otc_status=product.rx_otc_status,
        regulatory_status=product.regulatory_status,
        overall_score=product.overall_score,
        confidence_label=product.confidence_label,
        publish_status=product.publish_status,
        is_demo=product.is_demo,
        updated_at=product.updated_at,
        dosage_form=product.dosage_form,
        route=product.route,
        manufacturing_country=product.manufacturing_country,
        package_description=product.package_description,
        registration_valid_from=product.registration_valid_from,
        registration_valid_to=product.registration_valid_to,
        ingredients=[
            IngredientOut(
                name=item.ingredient.normalized_name,
                strength_value=item.strength_value,
                strength_unit=item.strength_unit,
                original_strength_text=item.original_strength_text,
            )
            for item in product.ingredients
        ],
        source_fields=[SourceFieldOut.model_validate(item) for item in product.source_fields],
        conflicts=[ConflictOut.model_validate(item) for item in product.conflicts],
        latest_score=ScoreOut.model_validate(latest_score) if latest_score else None,
    )


@router.get("/products")
def list_products(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = None,
    label: ConfidenceLabel | None = None,
    rx_otc: RxOtcStatus | None = None,
    is_demo: bool | None = None,
    publish_status: PublishStatus | None = None,
    has_conflict: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(or_(CanonicalProduct.canonical_name.ilike(pattern), CanonicalProduct.registration_number.ilike(pattern)))
    if label:
        conditions.append(CanonicalProduct.confidence_label == label)
    if rx_otc:
        conditions.append(CanonicalProduct.rx_otc_status == rx_otc)
    if is_demo is not None:
        conditions.append(CanonicalProduct.is_demo == is_demo)
    if publish_status:
        conditions.append(CanonicalProduct.publish_status == publish_status)
    if has_conflict is not None:
        conflict_exists = select(DataConflict.id).where(
            DataConflict.product_id == CanonicalProduct.id,
            DataConflict.status == ConflictStatus.OPEN,
        ).exists()
        conditions.append(conflict_exists if has_conflict else ~conflict_exists)
    total = db.scalar(select(func.count()).select_from(CanonicalProduct).where(*conditions)) or 0
    products = db.scalars(
        select(CanonicalProduct)
        .options(selectinload(CanonicalProduct.ingredients).selectinload(ProductIngredient.ingredient))
        .where(*conditions)
        .order_by(CanonicalProduct.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    p_ids = [p.id for p in products]
    prices_map: dict[int, float] = {}
    stocks_map: dict[int, int] = {}
    near_expiry_map: dict[int, int] = {}

    if p_ids:
        # 1. Prices
        price_rows = db.query(PriceObservation.product_id, PriceObservation.observed_price).filter(
            PriceObservation.product_id.in_(p_ids)
        ).all()
        for pid, pval in price_rows:
            if pid not in prices_map and pval is not None:
                prices_map[pid] = float(pval)

        # 2. Stocks
        stock_rows = db.query(
            ProductSku.canonical_product_id,
            func.sum(WarehouseBatchStock.quantity_available),
        ).join(
            InventoryBatch, InventoryBatch.sku_id == ProductSku.id
        ).join(
            WarehouseBatchStock, WarehouseBatchStock.batch_id == InventoryBatch.id
        ).filter(
            ProductSku.canonical_product_id.in_(p_ids)
        ).group_by(ProductSku.canonical_product_id).all()
        for pid, total_stk in stock_rows:
            stocks_map[pid] = int(total_stk or 0)

        # 3. Near expiry count (< 90 days)
        today = date.today()
        near_rows = db.query(
            ProductSku.canonical_product_id,
            func.count(InventoryBatch.id),
        ).join(
            InventoryBatch, InventoryBatch.sku_id == ProductSku.id
        ).filter(
            ProductSku.canonical_product_id.in_(p_ids),
            InventoryBatch.expiry_date >= today,
            InventoryBatch.expiry_date <= today + timedelta(days=90),
            InventoryBatch.status == "ACTIVE",
        ).group_by(ProductSku.canonical_product_id).all()
        for pid, n_cnt in near_rows:
            near_expiry_map[pid] = int(n_cnt or 0)

    items = []
    for p in products:
        item_dict = ProductSummary.model_validate(p).model_dump()
        item_dict["dosage_form"] = p.dosage_form or "Viên nén"
        item_dict["package_description"] = p.package_description or "Hộp tiêu chuẩn"
        item_dict["price"] = prices_map.get(p.id)
        item_dict["total_stock"] = stocks_map.get(p.id, 0)
        item_dict["near_expiry_count"] = near_expiry_map.get(p.id, 0)
        
        # Active ingredient
        ing_names = [pi.ingredient.normalized_name for pi in p.ingredients if pi.ingredient]
        item_dict["active_ingredient"] = ", ".join(ing_names) if ing_names else (p.indications or "—")
        items.append(item_dict)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    }


@router.get("/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.scalar(_product_query().where(CanonicalProduct.id == product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    return _detail(product)


@router.post("/products/{product_id}/recalculate", response_model=ScoreRecalculateResponse)
def recalculate(
    product_id: int,
    request: Request,
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
    db: Session = Depends(get_db),
):
    product = db.scalar(_product_query().where(CanonicalProduct.id == product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    result = calculate_product_score(db, product, "Người dùng yêu cầu tính lại")
    write_audit(db, "RECALCULATE_SCORE", "CanonicalProduct", product.id, user, request, before={"score": result.old_score}, after={"score": result.new_score})
    db.commit()
    return ScoreRecalculateResponse(
        product_id=product.id,
        old_score=result.old_score,
        new_score=result.new_score,
        confidence_label=result.label,
        reasons=result.reasons,
    )


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: ProcessingStatus | None = None,
    limit: int = Query(100, ge=1, le=200),
):
    query = select(ProductCandidate).order_by(ProductCandidate.id.desc()).limit(limit)
    if status:
        query = query.where(ProductCandidate.processing_status == status)
    return db.scalars(query).all()


@router.post("/candidates/{candidate_id}/match", response_model=CandidateOut)
def decide_candidate_match(
    candidate_id: int,
    payload: CandidateMatchRequest,
    request: Request,
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
    db: Session = Depends(get_db),
):
    candidate = db.get(ProductCandidate, candidate_id)
    product = db.get(CanonicalProduct, payload.product_id)
    if not candidate or not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy candidate hoặc sản phẩm")
    before = {"canonical_product_id": candidate.canonical_product_id, "status": candidate.processing_status.value}
    if payload.accept:
        candidate.canonical_product_id = product.id
        candidate.processing_status = ProcessingStatus.MATCHED
        decision = ReviewDecisionType.MERGE_ACCEPTED
    else:
        candidate.processing_status = ProcessingStatus.REJECTED
        decision = ReviewDecisionType.MERGE_REJECTED
    db.add(ReviewDecision(product_id=product.id, reviewer_id=user.id, decision=decision, note=payload.note))
    write_audit(db, "DECIDE_MATCH", "ProductCandidate", candidate.id, user, request, before=before, after={"accepted": payload.accept, "product_id": product.id})
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/conflicts", response_model=list[ConflictOut])
def list_conflicts(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: ConflictStatus | None = ConflictStatus.OPEN,
    limit: int = Query(100, ge=1, le=200),
):
    query = select(DataConflict).order_by(DataConflict.created_at.desc()).limit(limit)
    if status:
        query = query.where(DataConflict.status == status)
    return db.scalars(query).all()


@router.patch("/conflicts/{conflict_id}", response_model=ConflictOut)
def resolve_conflict(
    conflict_id: int,
    payload: ConflictResolveRequest,
    request: Request,
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
    db: Session = Depends(get_db),
):
    from datetime import UTC, datetime

    conflict = db.get(DataConflict, conflict_id)
    if not conflict:
        raise HTTPException(status_code=404, detail="Không tìm thấy mâu thuẫn")
    before = {"status": conflict.status.value, "resolution_note": conflict.resolution_note}
    conflict.status = payload.status
    conflict.resolution_note = payload.resolution_note
    conflict.resolved_by = user.id
    conflict.resolved_at = datetime.now(UTC) if payload.status != ConflictStatus.OPEN else None
    write_audit(db, "RESOLVE_CONFLICT", "DataConflict", conflict.id, user, request, before=before, after=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(conflict)
    return conflict


@router.post("/products/{product_id}/reviews", status_code=201)
def create_review(
    product_id: int,
    payload: ReviewCreate,
    request: Request,
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
    db: Session = Depends(get_db),
):
    product = db.get(CanonicalProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    review = ReviewDecision(product_id=product_id, reviewer_id=user.id, decision=payload.decision, note=payload.note)
    db.add(review)
    db.flush()
    write_audit(db, "CREATE_REVIEW", "CanonicalProduct", product_id, user, request, after=payload.model_dump(mode="json"))
    db.commit()
    return {"id": review.id, "message": "Đã lưu kết quả kiểm tra dữ liệu"}


@router.get("/products/{product_id}/score-history")
def score_history(product_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(ScoreHistory).where(ScoreHistory.product_id == product_id).order_by(ScoreHistory.calculated_at.desc())).all()


class UpdatePricingRequest(BaseModel):
    price: float
    availability_text: str | None = "Có sẵn"


@router.post("/products/{product_id}/publish")
def publish_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
):
    product = db.get(CanonicalProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    product.publish_status = PublishStatus.PUBLISHED
    db.commit()
    db.refresh(product)
    return {"message": "Đã duyệt và đăng bán sản phẩm thành công", "product_id": product.id, "publish_status": product.publish_status.value}


@router.post("/products/{product_id}/unpublish")
def unpublish_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
):
    product = db.get(CanonicalProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    product.publish_status = PublishStatus.DRAFT
    db.commit()
    db.refresh(product)
    return {"message": "Đã chuyển sản phẩm về bản nháp / ngừng bán", "product_id": product.id, "publish_status": product.publish_status.value}


@router.patch("/products/{product_id}/pricing")
def update_product_pricing(
    product_id: int,
    payload: UpdatePricingRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
):
    product = db.get(CanonicalProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    from app.models import PriceObservation, DataSource
    from decimal import Decimal
    po = db.query(PriceObservation).filter(PriceObservation.product_id == product_id).first()
    if po:
        po.observed_price = Decimal(str(payload.price))
        if payload.availability_text:
            po.availability_text = payload.availability_text
    else:
        source = db.query(DataSource).first()
        po = PriceObservation(
            product_id=product_id,
            source_id=source.id if source else 1,
            observed_price=Decimal(str(payload.price)),
            currency="VND",
            availability_text=payload.availability_text or "Có sẵn",
            source_url="https://pharmatrust.vn"
        )
        db.add(po)
    db.commit()
    return {"message": "Đã cập nhật giá bán thành công", "product_id": product_id, "price": payload.price}



@public_router.get("/products")
def public_products(
    db: Session = Depends(get_db),
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conditions = [
        CanonicalProduct.is_demo.is_(False),
        CanonicalProduct.publish_status == PublishStatus.PUBLISHED,
        CanonicalProduct.confidence_label == ConfidenceLabel.HIGH_OFFICIAL_MATCH,
        CanonicalProduct.overall_score >= settings.public_api_min_score,
    ]
    if search and search.strip():
        from app.services.search_service import search_product_ids_fts
        fts_ids = search_product_ids_fts(db, search.strip(), limit=page_size * 2)
        if fts_ids:
            conditions.append(CanonicalProduct.id.in_(fts_ids))
        else:
            pattern = f"%{search.strip()}%"
            conditions.append(or_(CanonicalProduct.canonical_name.ilike(pattern), CanonicalProduct.registration_number.ilike(pattern)))
    products = db.scalars(
        select(CanonicalProduct).where(*conditions).order_by(CanonicalProduct.canonical_name).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {"items": [ProductSummary.model_validate(item) for item in products], "page": page, "page_size": page_size}


@public_router.get("/search")
def public_search(
    q: str = Query(min_length=2, max_length=100),
    db: Session = Depends(get_db),
):
    return public_products(db=db, search=q, page=1, page_size=20)


@public_router.get("/products/{product_id}", response_model=ProductDetail)
def public_product(product_id: int, db: Session = Depends(get_db)):
    product = db.scalar(
        _product_query().where(
            CanonicalProduct.id == product_id,
            CanonicalProduct.is_demo.is_(False),
            CanonicalProduct.publish_status == PublishStatus.PUBLISHED,
            CanonicalProduct.overall_score >= settings.public_api_min_score,
        )
    )
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm đủ điều kiện công bố")
    return _detail(product)
