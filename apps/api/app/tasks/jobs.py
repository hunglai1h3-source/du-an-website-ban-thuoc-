from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import (
    CanonicalProduct,
    CrawlRun,
    DataSource,
    Ingredient,
    PriceObservation,
    ProductCandidate,
    ProductIngredient,
    ProductSourceField,
    RawDocument,
    RegulatoryRecord,
)
from app.models.enums import (
    ProcessingStatus,
    PublishStatus,
    RegulatoryStatus,
    RunStatus,
    RxOtcStatus,
    SourceType,
)
from app.services.crawler import CrawlPolicyError, get_adapter
from app.services.matching import match_products
from app.services.normalization import (
    extract_registration_number,
    normalize_for_match,
    normalize_registration_number,
)
from app.services.scoring import calculate_product_score
from app.tasks.celery_app import celery


SCHEDULE_INTERVALS = {
    "HOURLY": timedelta(hours=1),
    "DAILY": timedelta(days=1),
    "WEEKLY": timedelta(days=7),
}


@celery.task(name="dispatch_scheduled_sources")
def dispatch_scheduled_sources():
    db = SessionLocal()
    queued: list[int] = []
    try:
        sources = db.scalars(
            select(DataSource).where(
                DataSource.enabled.is_(True),
                DataSource.base_url.is_not(None),
                DataSource.source_type.notin_([SourceType.MANUAL_UPLOAD, SourceType.DEMO]),
            )
        ).all()
        now = datetime.now(UTC)
        for source in sources:
            interval = SCHEDULE_INTERVALS.get(source.crawl_frequency.upper())
            if not interval:
                continue
            last_run_at = source.last_success_at or source.last_failure_at
            if last_run_at and last_run_at.replace(tzinfo=last_run_at.tzinfo or UTC) > now - interval:
                continue
            active = db.scalar(
                select(CrawlRun.id).where(
                    CrawlRun.source_id == source.id,
                    CrawlRun.status.in_([RunStatus.QUEUED, RunStatus.RUNNING]),
                )
            )
            if active:
                continue
            run = CrawlRun(
                source_id=source.id,
                status=RunStatus.QUEUED,
                configuration_snapshot={"scheduled": True, "frequency": source.crawl_frequency},
            )
            db.add(run)
            db.flush()
            queued.append(run.id)
        db.commit()
        for run_id in queued:
            crawl_source_task.delay(run_id)
        return {"queued": queued}
    finally:
        db.close()


def execute_crawl(run_id: int) -> dict:
    """
    Hàm thực thi crawl đồng bộ, có thể chạy bởi Celery worker hoặc FastAPI BackgroundTasks.
    """
    db = SessionLocal()
    try:
        run = db.get(CrawlRun, run_id)
        if not run:
            return {"status": "missing"}
        source = db.get(DataSource, run.source_id)
        if not source or not source.base_url:
            run.status = RunStatus.FAILED
            run.error_message = "Nguồn chưa cấu hình URL; vui lòng nhập dữ liệu bằng tệp."
            run.finished_at = datetime.now(UTC)
            db.commit()
            return {"status": "failed", "reason": run.error_message}

        run.status = RunStatus.RUNNING
        run.started_at = datetime.now(UTC)
        db.commit()

        adapter = get_adapter(source)
        allowed, policy = adapter.check_access_policy()
        source.robots_status = policy
        if not allowed:
            raise CrawlPolicyError(policy)

        urls = adapter.discover()
        run.pages_requested = len(urls)
        for url in urls:
            try:
                result = adapter.fetch(url)
                existing = db.query(RawDocument).filter_by(
                    source_id=source.id,
                    source_url=result.url,
                    content_hash=result.content_hash,
                ).first()
                if existing:
                    document = existing
                    document.crawl_run_id = run.id
                    run.pages_success += 1
                else:
                    document = RawDocument(
                        source_id=source.id,
                        crawl_run_id=run.id,
                        source_url=result.url,
                        content_type=result.content_type,
                        raw_text=result.text,
                        content_hash=result.content_hash,
                        http_status=result.status_code,
                        file_size=len(result.content),
                        metadata_json={"adapter": type(adapter).__name__},
                        is_demo=False,
                    )
                    db.add(document)
                    db.flush()
                    run.pages_success += 1

                parsed_items = adapter.parse(result)
                for item in parsed_items:
                    name = item.get("name")
                    if not name:
                        continue

                    reg_num = normalize_registration_number(item.get("registration_number")) or extract_registration_number(name)
                    mfr = item.get("manufacturer")
                    dosage = item.get("dosage_form")
                    pkg = item.get("package")
                    rx_otc = item.get("rx_otc")
                    ingredients_json = item.get("ingredients") or []

                    candidate = db.query(ProductCandidate).filter_by(
                        raw_document_id=document.id,
                        observed_name=name,
                    ).first()
                    if not candidate:
                        candidate = ProductCandidate(
                            raw_document_id=document.id,
                            observed_name=name,
                            normalized_name=normalize_for_match(name),
                            registration_number_text=reg_num,
                            manufacturer_text=mfr,
                            dosage_form_text=dosage,
                            package_text=pkg,
                            rx_otc_text=rx_otc,
                            ingredients_json=ingredients_json,
                            image_url=item.get("image_url"),
                            description=item.get("description"),
                            usage_instructions=item.get("usage_instructions"),
                            indications=item.get("indications"),
                            contraindications=item.get("contraindications"),
                            side_effects=item.get("side_effects"),
                            storage_conditions=item.get("storage_conditions"),
                            extraction_confidence=0.95 if source.source_type == SourceType.REGULATORY else 0.85,
                            extraction_method=type(adapter).__name__,
                            processing_status=ProcessingStatus.EXTRACTED,
                        )
                        db.add(candidate)
                        db.flush()

                    # 1. Nguồn quản lý Dược chính thức (DAV / DrugBank VN):
                    if source.source_type == SourceType.REGULATORY and (reg_num or item.get("is_official")):
                        # Tạo hoặc cập nhật RegulatoryRecord chính thức
                        if reg_num:
                            reg_record = db.scalar(
                                select(RegulatoryRecord).where(RegulatoryRecord.registration_number == reg_num)
                            )
                            if not reg_record:
                                reg_record = RegulatoryRecord(
                                    registration_number=reg_num,
                                    official_name=name,
                                    manufacturer=mfr,
                                    dosage_form=dosage,
                                    package_description=pkg,
                                    ingredients_json=ingredients_json,
                                    rx_otc_status=RxOtcStatus.PRESCRIPTION if rx_otc == "Rx" else RxOtcStatus.OTC,
                                    regulatory_status=RegulatoryStatus.ACTIVE,
                                    source_url=item.get("source_url") or result.url,
                                    raw_document_id=document.id,
                                )
                                db.add(reg_record)
                                db.flush()

                            # Tạo hoặc cập nhật CanonicalProduct
                            canon_prod = db.scalar(
                                select(CanonicalProduct).where(CanonicalProduct.registration_number == reg_num)
                            )
                            if not canon_prod:
                                canon_prod = CanonicalProduct(
                                    canonical_name=name,
                                    registration_number=reg_num,
                                    dosage_form=dosage,
                                    route=item.get("route", "Uống"),
                                    manufacturer=mfr,
                                    manufacturing_country=item.get("manufacturing_country", "Việt Nam"),
                                    package_description=pkg,
                                    image_url=item.get("image_url"),
                                    description=item.get("description"),
                                    usage_instructions=item.get("usage_instructions"),
                                    indications=item.get("indications"),
                                    contraindications=item.get("contraindications"),
                                    side_effects=item.get("side_effects"),
                                    storage_conditions=item.get("storage_conditions"),
                                    regulatory_status=RegulatoryStatus.ACTIVE,
                                    rx_otc_status=RxOtcStatus.PRESCRIPTION if rx_otc == "Rx" else RxOtcStatus.OTC,
                                    publish_status=PublishStatus.PUBLISHED,
                                    is_demo=False,
                                )
                                db.add(canon_prod)
                                db.flush()
                            else:
                                for fld in ["image_url", "description", "usage_instructions", "indications", "contraindications", "side_effects", "storage_conditions"]:
                                    if item.get(fld) and not getattr(canon_prod, fld, None):
                                        setattr(canon_prod, fld, item[fld])

                                # Liên kết các hoạt chất
                                for ing in ingredients_json:
                                    ing_name = ing.get("name")
                                    if not ing_name:
                                        continue
                                    norm_ing = normalize_for_match(ing_name)
                                    ing_entity = db.scalar(
                                        select(Ingredient).where(Ingredient.normalized_name == norm_ing)
                                    )
                                    if not ing_entity:
                                        ing_entity = Ingredient(
                                            normalized_name=norm_ing,
                                            alternative_names=[ing_name],
                                        )
                                        db.add(ing_entity)
                                        db.flush()

                                    db.add(
                                        ProductIngredient(
                                            product_id=canon_prod.id,
                                            ingredient_id=ing_entity.id,
                                            strength_value=ing.get("strength_value"),
                                            strength_unit=ing.get("strength_unit"),
                                            original_strength_text=f"{ing.get('strength_value') or ''}{ing.get('strength_unit') or ''}".strip() or None,
                                        )
                                    )

                            # Thêm trường bằng chứng từ nguồn chính thức
                            for fname, fval in [
                                ("canonical_name", name),
                                ("registration_number", reg_num),
                                ("manufacturer", mfr),
                                ("dosage_form", dosage),
                            ]:
                                if fval:
                                    exists_sf = db.scalar(
                                        select(ProductSourceField).where(
                                            ProductSourceField.product_id == canon_prod.id,
                                            ProductSourceField.source_id == source.id,
                                            ProductSourceField.field_name == fname,
                                        )
                                    )
                                    if not exists_sf:
                                        db.add(
                                            ProductSourceField(
                                                product_id=canon_prod.id,
                                                source_id=source.id,
                                                raw_document_id=document.id,
                                                field_name=fname,
                                                original_value=str(fval),
                                                normalized_value=normalize_for_match(str(fval)),
                                                field_confidence=1.0,
                                                is_selected_value=True,
                                            )
                                        )

                            candidate.canonical_product_id = canon_prod.id
                            candidate.processing_status = ProcessingStatus.MATCHED
                            db.flush()
                            calculate_product_score(db, canon_prod, "Khớp trực tiếp với hồ sơ Cục Quản lý Dược")

                    # 2. Nguồn bán lẻ đối chiếu (Pharmacity / Long Châu):
                    elif source.source_type == SourceType.RETAILER:
                        # Tìm kiếm sản phẩm tương ứng trong kho dữ liệu chuẩn
                        matched_prod = None
                        if reg_num:
                            matched_prod = db.scalar(
                                select(CanonicalProduct).where(CanonicalProduct.registration_number == reg_num)
                            )
                        if not matched_prod:
                            existing_prods = db.scalars(select(CanonicalProduct)).all()
                            for ep in existing_prods:
                                res = match_products(
                                    item,
                                    {
                                        "name": ep.canonical_name,
                                        "registration_number": ep.registration_number,
                                        "manufacturer": ep.manufacturer,
                                        "ingredients": [{"name": pi.ingredient.normalized_name, "value": pi.strength_value, "unit": pi.strength_unit} for pi in ep.ingredients],
                                    },
                                )
                                if res.is_same_product or res.confidence >= 0.85:
                                    matched_prod = ep
                                    break

                        if matched_prod:
                            candidate.canonical_product_id = matched_prod.id
                            candidate.processing_status = ProcessingStatus.MATCHED

                            for fld in ["image_url", "description", "usage_instructions", "indications", "contraindications", "side_effects", "storage_conditions"]:
                                if item.get(fld) and not getattr(matched_prod, fld, None):
                                    setattr(matched_prod, fld, item[fld])

                            if item.get("price"):
                                db.add(
                                    PriceObservation(
                                        product_id=matched_prod.id,
                                        source_id=source.id,
                                        observed_price=Decimal(str(item["price"])),
                                        currency="VND",
                                        source_url=item.get("source_url") or result.url,
                                    )
                                )

                            db.add(
                                ProductSourceField(
                                    product_id=matched_prod.id,
                                    source_id=source.id,
                                    raw_document_id=document.id,
                                    field_name="retailer_consensus",
                                    original_value=f"Đối chiếu từ nhà bán lẻ {source.name}: {name}",
                                    normalized_value=normalize_for_match(name),
                                    field_confidence=0.8,
                                    is_selected_value=False,
                                )
                            )
                            db.flush()
                            calculate_product_score(db, matched_prod, f"Bổ sung bằng chứng từ {source.name}")
                        else:
                            candidate.processing_status = ProcessingStatus.REVIEW_REQUIRED

                    run.products_discovered += 1

                run.pages_success += 1
            except Exception as err:
                import traceback
                print(f"     [!] Lỗi xử lý URL {url}: {type(err).__name__}: {err}")
                traceback.print_exc()
                run.pages_failed += 1

        run.status = RunStatus.SUCCESS if run.pages_failed == 0 else RunStatus.PARTIAL
        run.finished_at = datetime.now(UTC)
        source.last_success_at = run.finished_at
        db.commit()
        return {"status": run.status.value, "products": run.products_discovered}
    except CrawlPolicyError as exc:
        run = db.get(CrawlRun, run_id)
        if run:
            run.status = RunStatus.FAILED
            run.error_message = str(exc)
            run.finished_at = datetime.now(UTC)
            source = db.get(DataSource, run.source_id)
            if source:
                source.last_failure_at = run.finished_at
            db.commit()
        return {"status": "failed", "reason": str(exc)}
    except Exception as exc:
        db.rollback()
        run = db.get(CrawlRun, run_id)
        if run:
            run.status = RunStatus.FAILED
            run.error_message = f"Lỗi tác vụ: {type(exc).__name__}: {exc}"
            run.finished_at = datetime.now(UTC)
            db.commit()
        return {"status": "failed", "error": str(exc)}
    finally:
        db.close()


@celery.task(name="crawl_source", bind=True, max_retries=2)
def crawl_source_task(self, run_id: int):
    try:
        return execute_crawl(run_id)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
