import hashlib
import logging
import random
import re
import time
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import (
    AdminAlert,
    CanonicalProduct,
    CrawlLock,
    CrawlRun,
    DataSource,
    FailedCrawlItem,
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
from app.services.browser_fallback import fetch_with_browser_fallback, is_cloudflare_or_captcha
from app.services.category_classifier import classifier as category_classifier
from app.services.crawler import (
    FetchResult,
    LongChauAdapter,
    PharmacityAdapter,
    USER_AGENT,
    extract_product_leaflet,
    get_adapter,
)
from app.services.matching import match_products
from app.services.normalization import (
    extract_registration_number,
    normalize_for_match,
    normalize_registration_number,
)
from app.services.image_storage import download_and_optimize_image
from app.services.scoring import calculate_product_score
from app.services.validation import evaluate_auto_publish_eligibility

logger = logging.getLogger("pharmatrust.crawler_pipeline")


def utcnow() -> datetime:
    return datetime.now(UTC)


def execute_crawl_pipeline(
    source_code: str,
    is_manual: bool = False,
    is_catchup: bool = False,
    publish_mode: str = "MANUAL_REVIEW",
    max_items: int = 25,
) -> dict[str, Any]:
    """
    Hàm lõi thực thi cào dữ liệu tăng dần và kiểm duyệt cho một nguồn.
    Tái sử dụng 100% giữa Scheduler định kỳ 6h và nút Chạy ngay của Admin.
    """
    from app.services.scheduler import DistributedLockService

    db: Session = SessionLocal()
    run = None
    source = None

    try:
        # 1. Kiểm tra và chiếm Distributed Lock
        acquired, lock_msg = DistributedLockService.acquire_lock(db, source_code)
        if not acquired:
            logger.warning(f"[{source_code}] Không thể chạy: {lock_msg}")
            # Ghi cảnh báo overlap nếu lặp lại
            lock = db.get(CrawlLock, source_code)
            if lock and (lock.overlap_count or 0) > 1:
                db.add(AdminAlert(
                    source_code=source_code,
                    alert_type="OVERLAP_WARNING",
                    severity="WARNING",
                    message=f"Nguồn {source_code} đã bị bỏ qua {lock.overlap_count} lần do tác vụ trước chưa kết thúc.",
                ))
                db.commit()
            return {"status": "SKIPPED_OVERLAP", "source": source_code, "reason": lock_msg}

        # 2. Tìm nguồn dữ liệu
        source = db.scalar(select(DataSource).where(DataSource.code == source_code))
        if not source or not source.enabled:
            DistributedLockService.release_lock(db, source_code)
            return {"status": "FAILED", "reason": f"Nguồn {source_code} không tồn tại hoặc bị tắt."}

        # 3. Tạo bản ghi CrawlRun
        now = utcnow()
        run = CrawlRun(
            source_id=source.id,
            status=RunStatus.RUNNING,
            started_at=now,
            configuration_snapshot={
                "is_manual": is_manual,
                "is_catchup": is_catchup,
                "publish_mode": publish_mode,
                "source_code": source_code,
            },
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Cập nhật run_id vào lock
        lock = db.get(CrawlLock, source_code)
        if lock:
            lock.current_run_id = run.id
            db.commit()

        # 4. Thực thi cào theo từng nguồn độc lập
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        }

        urls_to_crawl: list[str] = []
        adapter = get_adapter(source)

        if source_code == "PHARMACITY":
            try:
                # Lấy danh sách URL từ sitemap hoặc danh mục
                sitemap_resp = httpx.get("https://www.pharmacity.vn/sitemaps/products.xml", headers=headers, timeout=15)
                if sitemap_resp.status_code == 200:
                    found_urls = re.findall(r"<loc>(https://www\.pharmacity\.vn/[^<]+\.html)</loc>", sitemap_resp.text)
                    med_urls = [u for u in found_urls if any(k in u for k in ["thuoc", "vien", "sui", "khang-sinh", "giam-dau", "siro", "ha-sot"])]
                    urls_to_crawl = (med_urls or found_urls)[:max_items]
                else:
                    urls_to_crawl = adapter.discover()[:max_items]
            except Exception as exc:
                logger.error(f"Lỗi khi khám phá URL Pharmacity: {exc}")
                urls_to_crawl = adapter.discover()[:max_items]

        elif source_code == "LONG_CHAU":
            # Kiểm tra HTTP trước theo quy định
            test_url = "https://nhathuoclongchau.com.vn/thuoc"
            http_blocked = False
            try:
                test_resp = httpx.get(test_url, headers=headers, timeout=10, follow_redirects=True)
                if test_resp.status_code == 403 or is_cloudflare_or_captcha(test_resp.text, test_resp.status_code):
                    http_blocked = True
            except Exception:
                http_blocked = True

            if http_blocked:
                logger.warning("[LONG_CHAU] Nhận mã 403 Forbidden từ HTTP. Thử nghiệm Browser Fallback công khai...")
                # Thử nghiệm Browser Fallback công khai
                browser_res = fetch_with_browser_fallback(test_url)
                if browser_res.is_blocked:
                    # DỪNG RIÊNG NGUỒN LONG CHÂU, ĐẶT SOURCE_BLOCKED VÀ BÁO CÁO ADMIN
                    source.robots_status = "SOURCE_BLOCKED"
                    db.add(AdminAlert(
                        source_code="LONG_CHAU",
                        alert_type="SOURCE_BLOCKED",
                        severity="CRITICAL",
                        message="Nhà thuốc Long Châu phát hiện cơ chế bảo vệ Cloudflare/CAPTCHA trên trang công khai. Nguồn Long Châu đã tạm dừng an toàn theo quy định bot-safety. Pharmacity vẫn tiếp tục chạy.",
                    ))
                    db.add(FailedCrawlItem(
                        source_id=source.id,
                        crawl_run_id=run.id,
                        url=test_url,
                        error_type="HTTP_403_CAPTCHA",
                        error_message=browser_res.error_message or "Cloudflare 403 / CAPTCHA detected.",
                    ))
                    run.status = RunStatus.FAILED
                    run.error_message = "SOURCE_BLOCKED: Bị chặn bởi cơ chế chống bot / Cloudflare 403. Dừng nguồn an toàn."
                    run.finished_at = utcnow()
                    source.last_failure_at = run.finished_at
                    db.commit()

                    # Gửi cảnh báo khẩn cấp tới Telegram / Webhook cho Admin
                    from app.services.alert_notifier import dispatch_alert
                    dispatch_alert(
                        title="Long Châu bị chặn (SOURCE_BLOCKED)",
                        message="Hệ thống phát hiện Cloudflare 403 / CAPTCHA Challenge trên trang công khai của Long Châu. Đã dừng nguồn Long Châu an toàn theo quy định, không bypass. Nguồn Pharmacity vẫn hoạt động bình thường.",
                        severity="CRITICAL",
                        alert_type="SOURCE_BLOCKED",
                        details={"Nguồn": "Nhà thuốc Long Châu", "URL": test_url, "Hành động": "Tự động ngắt kết nối an toàn"},
                    )
                    return {"status": "SOURCE_BLOCKED", "source": "LONG_CHAU", "reason": run.error_message}
                else:
                    # Nếu browser vượt qua thành công
                    urls_to_crawl = adapter.discover()[:max_items]
            else:
                urls_to_crawl = adapter.discover()[:max_items]

        run.pages_requested = len(urls_to_crawl)
        db.commit()

        # 5. Tiến hành cào từng URL với Bounded Retry và Exponential Backoff
        auto_published_count = 0
        needs_review_count = 0
        linked_duplicates_count = 0

        for url in urls_to_crawl:
            content_text = ""
            status_code = 0
            retries = 0
            max_retries = 2

            # Retry có jitter cho lỗi 429 hoặc 5xx
            while retries <= max_retries:
                try:
                    resp = httpx.get(url, headers=headers, timeout=12)
                    status_code = resp.status_code
                    if status_code == 200:
                        content_text = resp.text
                        break
                    elif status_code in {429, 500, 502, 503, 504}:
                        retries += 1
                        time.sleep(2 ** retries + random.uniform(0.1, 0.5))
                        continue
                    else:
                        # 400, 401, 403, 404 không retry mù quáng
                        break
                except httpx.RequestError:
                    retries += 1
                    time.sleep(2 ** retries + random.uniform(0.1, 0.5))

            if not content_text or status_code != 200:
                run.pages_failed += 1
                db.add(FailedCrawlItem(
                    source_id=source.id,
                    crawl_run_id=run.id,
                    url=url,
                    error_type=f"HTTP_{status_code}" if status_code else "NETWORK_TIMEOUT",
                    error_message=f"Không thể tải nội dung (HTTP {status_code})",
                ))
                db.commit()
                continue

            run.pages_success += 1

            # Băm SHA256 chống trùng cấp tài liệu
            content_hash = hashlib.sha256(content_text.encode("utf-8")).hexdigest()
            raw_doc = db.query(RawDocument).filter_by(
                source_id=source.id,
                source_url=url,
                content_hash=content_hash,
            ).first()

            if not raw_doc:
                raw_doc = RawDocument(
                    source_id=source.id,
                    crawl_run_id=run.id,
                    source_url=url,
                    content_type="text/html",
                    raw_text=content_text,
                    content_hash=content_hash,
                    http_status=status_code,
                    file_size=len(content_text.encode("utf-8")),
                    metadata_json={"crawled_at": utcnow().isoformat()},
                )
                db.add(raw_doc)
                db.flush()

            # Parse dữ liệu thuốc
            doc_obj = FetchResult(
                url=url,
                status_code=status_code,
                content_type="text/html",
                content=content_text.encode("utf-8"),
                text=content_text,
                content_hash=content_hash,
            )
            parsed_items = adapter.parse(doc_obj)
            if not parsed_items:
                continue

            item = parsed_items[0]
            name = item.get("name", "").strip()
            if not name:
                continue

            reg_num = normalize_registration_number(item.get("registration_number")) or extract_registration_number(name)
            dosage = item.get("dosage_form") or ("Viên nén" if "viên" in name.lower() else "Dược phẩm")
            package = item.get("package") or "Hộp"
            price = item.get("price")
            image_url = item.get("image_url")
            is_rx = item.get("is_rx") or any(k in name.lower() for k in ["kê đơn", "rx", "kháng sinh", "concor", "augmentin", "zinnat"])

            # 6. Phát hiện trùng lặp & liên kết nguồn (Không xóa vật lý, giữ lịch sử)
            matched_prod = None
            if reg_num:
                matched_prod = db.scalar(
                    select(CanonicalProduct).where(CanonicalProduct.registration_number == reg_num)
                )

            if not matched_prod:
                # So khớp bằng tên và các thuộc tính y khoa
                existing_prods = db.scalars(select(CanonicalProduct)).all()
                for ep in existing_prods:
                    # Hai sản phẩm cùng tên nhưng khác hàm lượng hoặc dạng bào chế không được coi là trùng
                    if ep.canonical_name and normalize_for_match(ep.canonical_name) == normalize_for_match(name):
                        if ep.dosage_form and dosage and ep.dosage_form.lower() != dosage.lower():
                            continue
                        matched_prod = ep
                        break
                    else:
                        m_res = match_products(item, {
                            "name": ep.canonical_name,
                            "registration_number": ep.registration_number,
                            "manufacturer": ep.manufacturer,
                            "ingredients": [{"name": pi.ingredient.normalized_name, "value": pi.strength_value, "unit": pi.strength_unit} for pi in ep.ingredients],
                        })
                        if m_res.is_same_product:
                            matched_prod = ep
                            break

            if matched_prod:
                # LIÊN KẾT NGUỒN VÀO SẢN PHẨM HIỆN CÓ, KHÔNG TẠO BẢN GHI MỚI, KHÔNG XÓA VẬT LÝ
                linked_duplicates_count += 1
                if price:
                    db.add(PriceObservation(
                        product_id=matched_prod.id,
                        source_id=source.id,
                        observed_price=Decimal(str(price)),
                        currency="VND",
                        source_url=url,
                    ))
                db.add(ProductSourceField(
                    product_id=matched_prod.id,
                    source_id=source.id,
                    raw_document_id=raw_doc.id,
                    field_name="linked_source",
                    original_value=f"Liên kết nguồn {source.name} vào sản phẩm có sẵn: {url}",
                    normalized_value=normalize_for_match(name),
                    field_confidence=0.9,
                    is_selected_value=False,
                ))
                # Cập nhật ảnh/leaflet nếu sản phẩm cũ chưa có
                for fld in ["image_url", "description", "usage_instructions", "indications", "contraindications", "side_effects", "storage_conditions"]:
                    if item.get(fld) and not getattr(matched_prod, fld, None):
                        setattr(matched_prod, fld, item[fld])
                if matched_prod.image_url and not matched_prod.local_image_url:
                    loc_img, loc_thumb = download_and_optimize_image(matched_prod.image_url, matched_prod.id)
                    if loc_img:
                        matched_prod.local_image_url = loc_img
                        matched_prod.local_thumbnail_url = loc_thumb
                db.commit()

            else:
                # TẠO SẢN PHẨM MỚI TẠI STAGING
                run.products_discovered += 1

                # Phân loại danh mục qua AI
                cat_result = category_classifier.classify(
                    name=name,
                    ingredients=item.get("ingredients"),
                    dosage_form=dosage,
                    indications=item.get("indications"),
                    is_rx=is_rx,
                )

                new_prod = CanonicalProduct(
                    canonical_name=name,
                    registration_number=reg_num,
                    manufacturer=item.get("manufacturer"),
                    dosage_form=dosage,
                    package_description=package,
                    image_url=image_url,
                    description=item.get("description"),
                    usage_instructions=item.get("usage_instructions"),
                    indications=item.get("indications"),
                    contraindications=item.get("contraindications"),
                    side_effects=item.get("side_effects"),
                    storage_conditions=item.get("storage_conditions"),
                    regulatory_status=RegulatoryStatus.ACTIVE,
                    rx_otc_status=RxOtcStatus.PRESCRIPTION if is_rx else RxOtcStatus.OTC,
                    publish_status=PublishStatus.DRAFT,  # Mặc định luôn là DRAFT
                    publish_mode=publish_mode,
                    category_slug=cat_result.category_slug,
                    subcategory_slug=cat_result.subcategory_slug,
                    category_confidence=cat_result.confidence,
                    category_review_status="CATEGORY_REVIEW_REQUIRED" if cat_result.requires_review else "AUTO_RESOLVED",
                    category_review_reason=cat_result.reasoning if cat_result.requires_review else None,
                    is_demo=False,
                )
                db.add(new_prod)
                db.flush()

                # Tải & tối ưu ảnh WebP cho thuốc mới
                if image_url:
                    loc_img, loc_thumb = download_and_optimize_image(image_url, new_prod.id)
                    if loc_img:
                        new_prod.local_image_url = loc_img
                        new_prod.local_thumbnail_url = loc_thumb

                # Nếu AI không đủ chắc chắn danh mục -> Báo Admin
                if cat_result.requires_review:
                    needs_review_count += 1
                    db.add(AdminAlert(
                        source_code=source_code,
                        alert_type="CATEGORY_REVIEW_REQUIRED",
                        severity="WARNING",
                        message=f"Thuốc '{name}' cần Admin phân loại danh mục (Điểm AI: {cat_result.confidence:.2f}).",
                    ))

                # Đánh giá điều kiện AUTO_PUBLISH_VALID
                is_eligible, reasons = evaluate_auto_publish_eligibility(db, new_prod, publish_mode=publish_mode)
                if is_eligible and publish_mode == "AUTO_PUBLISH_VALID":
                    new_prod.publish_status = PublishStatus.PUBLISHED
                    auto_published_count += 1
                else:
                    new_prod.publish_status = PublishStatus.DRAFT

                # Lưu giá bán
                if price:
                    db.add(PriceObservation(
                        product_id=new_prod.id,
                        source_id=source.id,
                        observed_price=Decimal(str(price)),
                        currency="VND",
                        source_url=url,
                    ))

                calculate_product_score(db, new_prod, f"Cào tự động từ {source.name}")
                db.commit()

        run.status = RunStatus.SUCCESS if run.pages_failed == 0 else RunStatus.PARTIAL
        run.finished_at = utcnow()
        source.last_success_at = run.finished_at
        db.commit()

        # Gửi thông báo tóm tắt tới Telegram nếu được bật
        from app.services.alert_notifier import dispatch_alert
        dispatch_alert(
            title=f"Báo cáo cào tự động 24/7 ({source_code})",
            message=f"Đã hoàn tất chu kỳ cào cho nguồn {source.name}.\n• Thuốc mới khám phá: {run.products_discovered}\n• Thuốc trùng liên kết nguồn: {linked_duplicates_count}\n• Tự động đăng Storefront: {auto_published_count}\n• Chờ Admin phân loại danh mục: {needs_review_count}",
            severity="SUCCESS" if run.status == RunStatus.SUCCESS else "WARNING",
            alert_type="CRAWL_COMPLETED",
            details={
                "Nguồn": source.name,
                "Trạng thái": run.status.value,
                "Số trang thành công": run.pages_success,
                "Số trang thất bại": run.pages_failed,
            },
        )

        logger.info(f"[{source_code}] Hoàn tất cào dữ liệu: Khám phá={run.products_discovered}, Trùng đã liên kết={linked_duplicates_count}, Tự đăng={auto_published_count}, Chờ duyệt={needs_review_count}")
        return {
            "status": run.status.value,
            "source": source_code,
            "products_discovered": run.products_discovered,
            "linked_duplicates": linked_duplicates_count,
            "auto_published": auto_published_count,
            "needs_review": needs_review_count,
        }

    except Exception as exc:
        db.rollback()
        logger.error(f"[{source_code}] Lỗi ngoại lệ trong pipeline cào: {exc}", exc_info=True)
        if run:
            run.status = RunStatus.FAILED
            run.error_message = str(exc)
            run.finished_at = utcnow()
            if source:
                source.last_failure_at = run.finished_at
            db.commit()

        from app.services.alert_notifier import dispatch_alert
        dispatch_alert(
            title=f"Lỗi cào dữ liệu ({source_code})",
            message=f"Pipeline cào gặp lỗi ngoại lệ: {exc}",
            severity="ERROR",
            alert_type="CRAWL_FAILED",
            details={"Nguồn": source_code, "Lỗi": str(exc)},
        )
        return {"status": "FAILED", "source": source_code, "error": str(exc)}

    finally:
        DistributedLockService.release_lock(db, source_code)
        db.close()
