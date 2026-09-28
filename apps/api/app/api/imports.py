from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import DataSource, User
from app.models.enums import SourceType, UserRole
from app.services.audit import write_audit
from app.services.importer import ImportValidationError, import_rows


router = APIRouter(prefix="/imports", tags=["Nhập dữ liệu"])

ALLOWED_MIME_TYPES = {
    "text/csv",
    "text/plain",
    "application/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/octet-stream",
}


@router.post("/file", status_code=201)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    source_id: int = Form(...),
    is_demo: bool = Form(False),
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.DATA_REVIEWER)),
    db: Session = Depends(get_db),
):
    source = db.get(DataSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguồn dữ liệu")
    if source.source_type not in {SourceType.MANUAL_UPLOAD, SourceType.REGULATORY, SourceType.MANUFACTURER, SourceType.APPROVED_LEAFLET, SourceType.DEMO}:
        raise HTTPException(status_code=400, detail="Nguồn này không được cấu hình để nhập tệp")
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail=f"MIME type {file.content_type} chưa được hỗ trợ")
    content = await file.read()
    try:
        result = import_rows(db, source.id, file.filename or "upload.bin", content, is_demo=is_demo)
    except (ImportValidationError, UnicodeDecodeError, ValueError) as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    write_audit(
        db,
        "IMPORT_FILE",
        "DataSource",
        source.id,
        user,
        request,
        after={"filename": file.filename, **result, "is_demo": is_demo},
    )
    db.commit()
    return {"message": "Đã nhập tệp", **result}

