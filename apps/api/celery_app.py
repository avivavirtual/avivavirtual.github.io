from celery import Celery
from celery.schedules import crontab

from config import settings

celery = Celery(
    "avivavirtual",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "tasks.transcription",
        "tasks.summarization",
        "tasks.embeddings",
        "tasks.cdr_sync",
        "tasks.sla_checker",
        "tasks.data_retention",
    ],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Toronto",
    enable_utc=True,
    task_acks_late=True,
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "tasks.transcription.*": {"queue": "transcription"},
        "tasks.summarization.*": {"queue": "summarization"},
        "tasks.embeddings.*": {"queue": "embeddings"},
        "tasks.cdr_sync.*": {"queue": "default"},
        "tasks.sla_checker.*": {"queue": "default"},
        "tasks.data_retention.*": {"queue": "default"},
    },
    beat_schedule={
        "sync-voipms-cdr": {"task": "tasks.cdr_sync.sync_cdr", "schedule": 3600.0},
        "check-sla-breaches": {"task": "tasks.sla_checker.check_sla_breaches", "schedule": 300.0},
        "data-retention-cleanup": {"task": "tasks.data_retention.cleanup", "schedule": crontab(hour=2, minute=0)},
    },
)
