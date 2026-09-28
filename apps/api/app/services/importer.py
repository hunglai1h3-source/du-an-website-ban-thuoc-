import csv
import hashlib
import io
import json
import re
from pathlib import Path
from typing import Any

from openpyxl import load_workbook
from pdf2image import convert_from_bytes
from PIL import Image
from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import ProductCandidate, RawDocument
from app.models.enums import ProcessingStatus
from app.services.ai_provider import get_ai_provider
from app.services.normalization import extract_registration_number, normalize_for_match, normalize_text


ALLOWED_SUFFIXES = {".csv", ".xlsx", ".json", ".pdf", ".png", ".jpg", ".jpeg"}
ALIASES = {
    "name": ["name", "product_name", "ten_thuoc", "tên thuốc", "ten san pham", "tên sản phẩm"],
    "registration_number": ["registration_number", "so_dang_ky", "số đăng ký", "sdk"],
    "manufacturer": ["manufacturer", "nha_san_xuat", "nhà sản xuất", "nsx"],
    "dosage_form": ["dosage_form", "dang_bao_che", "dạng bào chế"],
    "package": ["package", "package_description", "quy_cach", "quy cách"],
    "rx_otc": ["rx_otc", "rx_otc_status", "phan_loai", "phân loại"],
    "ingredients": ["ingredients", "active_ingredients", "hoat_chat", "hoạt chất"],
}


class ImportValidationError(ValueError):
    pass


def safe_filename(filename: str) -> str:
    stem = re.sub(r"[^A-Za-z0-9._-]", "_", Path(filename).name)
    return stem[:180] or "upload.bin"


def validate_upload(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise ImportValidationError(f"Định dạng {suffix or 'không xác định'} chưa được hỗ trợ")
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise ImportValidationError(f"Tệp vượt quá {settings.max_upload_mb} MB")
    if not content:
        raise ImportValidationError("Tệp rỗng")
    return suffix


def _canonical_row(row: dict[str, Any]) -> dict[str, Any]:
    normalized_keys = {normalize_for_match(str(key)).replace(" ", "_"): value for key, value in row.items()}
    result: dict[str, Any] = {}
    for target, aliases in ALIASES.items():
        for alias in aliases:
            key = normalize_for_match(alias).replace(" ", "_")
            if key in normalized_keys and normalized_keys[key] not in (None, ""):
                result[target] = normalized_keys[key]
                break
    return result


def _rows_from_csv(content: bytes) -> list[dict[str, Any]]:
    text = content.decode("utf-8-sig")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    return [dict(row) for row in csv.DictReader(io.StringIO(text), dialect=dialect)]


def _rows_from_xlsx(content: bytes) -> list[dict[str, Any]]:
    workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    try:
        headers = [str(item or "").strip() for item in next(rows)]
    except StopIteration:
        return []
    return [dict(zip(headers, values, strict=False)) for values in rows if any(value is not None for value in values)]


def _rows_from_json(content: bytes) -> list[dict[str, Any]]:
    data = json.loads(content.decode("utf-8"))
    if isinstance(data, dict):
        data = data.get("items", [data])
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ImportValidationError("JSON phải là object hoặc danh sách object")
    return data


def _extract_document_text(content: bytes, suffix: str) -> str:
    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(content))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if text.strip():
            return text
        images = convert_from_bytes(content, dpi=200, first_page=1, last_page=min(5, len(reader.pages)))
        return "\n".join(_ocr_image(image) for image in images)
    return _ocr_image(Image.open(io.BytesIO(content)))


def _ocr_image(image: Image.Image) -> str:
    import pytesseract

    return pytesseract.image_to_string(image.convert("RGB"), lang="vie+eng")


def _row_from_document(text: str) -> dict[str, Any]:
    lines = [normalize_text(line) for line in text.splitlines() if normalize_text(line)]
    name = lines[0] if lines else "Tài liệu chưa xác định tên thuốc"
    manufacturer_match = re.search(r"(?:Nhà sản xuất|Sản xuất bởi)\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    ingredient_match = re.search(r"(?:Thành phần|Hoạt chất)\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    package_match = re.search(r"(?:Quy cách)\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    return {
        "name": name,
        "registration_number": extract_registration_number(text),
        "manufacturer": manufacturer_match.group(1).strip() if manufacturer_match else None,
        "ingredients": ingredient_match.group(1).strip() if ingredient_match else None,
        "package": package_match.group(1).strip() if package_match else None,
    }


def parse_upload(filename: str, content: bytes) -> tuple[list[dict[str, Any]], str | None, dict[str, Any] | None]:
    suffix = validate_upload(filename, content)
    if suffix == ".csv":
        return _rows_from_csv(content), None, None
    if suffix == ".xlsx":
        return _rows_from_xlsx(content), None, None
    if suffix == ".json":
        return _rows_from_json(content), None, None
    text = _extract_document_text(content, suffix)
    result = get_ai_provider().extract_product(text)
    extracted = result.data.model_dump()
    extracted["name"] = extracted.pop("product_name", None)
    extracted["package"] = extracted.pop("package_description", None)
    extracted["rx_otc"] = extracted.pop("rx_otc_status", "UNKNOWN")
    return [extracted], text, {
        "provider": result.provider,
        "model": result.model,
        "prompt_hash": result.prompt_hash,
        "fallback_used": result.fallback_used,
        "warnings": result.warnings,
    }


def import_rows(
    db: Session,
    source_id: int,
    filename: str,
    content: bytes,
    is_demo: bool = False,
) -> dict[str, Any]:
    rows, document_text, ai_metadata = parse_upload(filename, content)
    filename = safe_filename(filename)
    file_hash = hashlib.sha256(content).hexdigest()
    upload_path = settings.upload_storage / f"{file_hash[:16]}_{filename}"
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    if not upload_path.exists():
        upload_path.write_bytes(content)

    created = 0
    skipped = 0
    errors: list[dict[str, Any]] = []
    for index, raw_row in enumerate(rows, start=1):
        row = _canonical_row(raw_row)
        if not row.get("name"):
            errors.append({"row": index, "error": "Thiếu tên thuốc"})
            continue
        row_json = json.dumps(raw_row, ensure_ascii=False, sort_keys=True, default=str)
        content_hash = hashlib.sha256(row_json.encode()).hexdigest()
        source_url = f"upload://{filename}#row={index}"
        exists = db.scalar(
            select(RawDocument.id).where(
                RawDocument.source_id == source_id,
                RawDocument.source_url == source_url,
                RawDocument.content_hash == content_hash,
            )
        )
        if exists:
            skipped += 1
            continue
        document = RawDocument(
            source_id=source_id,
            source_url=source_url,
            content_type="application/json" if document_text is None else "text/plain",
            local_storage_path=str(upload_path),
            raw_text=document_text or row_json,
            content_hash=content_hash,
            http_status=None,
            file_size=len(content),
            metadata_json={"original_filename": filename, "row_number": index, "ai": ai_metadata},
            is_demo=is_demo,
        )
        db.add(document)
        db.flush()
        ingredients_value = row.get("ingredients")
        if isinstance(ingredients_value, list):
            ingredients = ingredients_value
        elif ingredients_value:
            ingredients = [{"name": str(ingredients_value)}]
        else:
            ingredients = []
        present_fields = sum(bool(row.get(key)) for key in ("name", "registration_number", "manufacturer", "dosage_form", "package", "ingredients"))
        candidate = ProductCandidate(
            raw_document_id=document.id,
            observed_name=str(row["name"]),
            normalized_name=normalize_for_match(str(row["name"])),
            registration_number_text=str(row.get("registration_number") or "") or None,
            manufacturer_text=str(row.get("manufacturer") or "") or None,
            dosage_form_text=str(row.get("dosage_form") or "") or None,
            package_text=str(row.get("package") or "") or None,
            rx_otc_text=str(row.get("rx_otc") or "") or None,
            ingredients_json=ingredients,
            extraction_confidence=round(present_fields / 6, 2),
            extraction_method=(ai_metadata or {}).get("provider", "PARSER").upper() if document_text is not None else "PARSER",
            extraction_model=(ai_metadata or {}).get("model"),
            processing_status=ProcessingStatus.EXTRACTED,
        )
        db.add(candidate)
        created += 1
    db.flush()
    return {"created": created, "skipped": skipped, "errors": errors, "total_rows": len(rows)}
