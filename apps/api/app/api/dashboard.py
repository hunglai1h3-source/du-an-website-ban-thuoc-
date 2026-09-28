from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import AuditLog, CanonicalProduct, CrawlRun, DataConflict, RawDocument, User
from app.models.enums import ConfidenceLabel, ConflictStatus, UserRole


router = APIRouter(tags=["Dashboard và nhật ký"])


@router.get("/dashboard/summary")
def summary(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    label_rows = db.execute(
        select(CanonicalProduct.confidence_label, func.count(CanonicalProduct.id)).group_by(CanonicalProduct.confidence_label)
    ).all()
    label_counts = {label.value: count for label, count in label_rows}
    return {
        "documents": db.scalar(select(func.count(RawDocument.id))) or 0,
        "products": db.scalar(select(func.count(CanonicalProduct.id))) or 0,
        "high_match": label_counts.get(ConfidenceLabel.HIGH_OFFICIAL_MATCH.value, 0),
        "review_required": label_counts.get(ConfidenceLabel.REVIEW_REQUIRED.value, 0),
        "insufficient": label_counts.get(ConfidenceLabel.INSUFFICIENT_EVIDENCE.value, 0),
        "blocked": label_counts.get(ConfidenceLabel.BLOCKED.value, 0),
        "open_conflicts": db.scalar(select(func.count(DataConflict.id)).where(DataConflict.status == ConflictStatus.OPEN)) or 0,
        "label_distribution": label_counts,
        "recent_runs": [
            {
                "id": item.id,
                "source_id": item.source_id,
                "status": item.status.value,
                "products_discovered": item.products_discovered,
                "started_at": item.started_at,
            }
            for item in db.scalars(select(CrawlRun).order_by(CrawlRun.id.desc()).limit(5)).all()
        ],
    }


@router.get("/audit-logs")
def audit_logs(
    _: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
    limit: int = 100,
):
    return db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(min(limit, 200))).all()

