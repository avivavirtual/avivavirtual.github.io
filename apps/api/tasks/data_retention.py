import asyncio
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import select

from celery_app import celery
from config import settings
from database import AsyncSessionLocal
from models import CallRecord
from services.audit_service import audit


@celery.task(name="tasks.data_retention.cleanup")
def cleanup() -> dict:
    return asyncio.run(_cleanup())


async def _cleanup() -> dict:
    recording_cutoff = datetime.utcnow() - timedelta(days=settings.RECORDING_RETAIN_DAYS)
    transcript_cutoff = datetime.utcnow() - timedelta(days=settings.TRANSCRIPTION_RETAIN_DAYS)
    recordings_deleted = 0
    transcripts_deleted = 0
    async with AsyncSessionLocal() as db:
        recording_rows = (
            await db.execute(
                select(CallRecord).where(CallRecord.recording_stored_url.is_not(None), CallRecord.created_at < recording_cutoff)
            )
        ).scalars().all()
        for record in recording_rows:
            path = Path(record.recording_stored_url or "")
            if path.exists() and path.is_file():
                path.unlink()
            record.recording_stored_url = None
            await audit(db, "call_recording.deleted", record.organization_id, None, "call_record", record.id)
            recordings_deleted += 1
        transcript_rows = (
            await db.execute(
                select(CallRecord).where(CallRecord.transcription.is_not(None), CallRecord.created_at < transcript_cutoff)
            )
        ).scalars().all()
        for record in transcript_rows:
            record.transcription = None
            record.summary = None
            await audit(db, "call_transcript.deleted", record.organization_id, None, "call_record", record.id)
            transcripts_deleted += 1
        await db.commit()
    return {"recordings_deleted": recordings_deleted, "transcripts_deleted": transcripts_deleted}
