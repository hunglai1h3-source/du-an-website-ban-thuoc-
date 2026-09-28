from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, Field

from app.models.enums import RunStatus, SourceType
from app.schemas.common import ORMModel


class DataSourceCreate(BaseModel):
    code: str = Field(pattern=r"^[A-Z0-9_-]{2,80}$")
    name: str = Field(min_length=2, max_length=255)
    source_type: SourceType
    base_url: AnyHttpUrl | None = None
    authority_level: int = Field(default=1, ge=1, le=5)
    authority_weight: float = Field(default=0.5, ge=0, le=1)
    enabled: bool = True
    terms_note: str | None = None
    rate_limit: float = Field(default=1.0, ge=0.1, le=60)
    crawl_frequency: str = "MANUAL"


class DataSourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    base_url: AnyHttpUrl | None = None
    authority_level: int | None = Field(default=None, ge=1, le=5)
    authority_weight: float | None = Field(default=None, ge=0, le=1)
    enabled: bool | None = None
    terms_note: str | None = None
    rate_limit: float | None = Field(default=None, ge=0.1, le=60)
    crawl_frequency: str | None = None


class DataSourceOut(ORMModel):
    id: int
    code: str
    name: str
    source_type: SourceType
    base_url: str | None
    authority_level: int
    authority_weight: float
    enabled: bool
    robots_status: str
    terms_note: str | None
    rate_limit: float
    crawl_frequency: str
    last_success_at: datetime | None
    last_failure_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CrawlRunOut(ORMModel):
    id: int
    source_id: int
    status: RunStatus
    started_at: datetime | None
    finished_at: datetime | None
    pages_requested: int
    pages_success: int
    pages_failed: int
    products_discovered: int
    error_message: str | None
    configuration_snapshot: dict

