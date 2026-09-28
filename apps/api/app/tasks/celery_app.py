from celery import Celery

from app.core.config import settings


celery = Celery("pharmatrust", broker=settings.redis_url, backend=settings.redis_url)
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
    beat_schedule={
        "dispatch-scheduled-sources": {
            "task": "dispatch_scheduled_sources",
            "schedule": 300.0,
        }
    },
)
celery.autodiscover_tasks(["app.tasks"])
