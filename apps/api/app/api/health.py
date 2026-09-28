from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models import User
from app.services.ai_provider import get_ai_provider


router = APIRouter(tags=["Hệ thống"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/ai/status")
def ai_status(_: User = Depends(get_current_user)):
    return get_ai_provider().health()
