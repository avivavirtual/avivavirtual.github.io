import asyncio
from pathlib import Path
import tempfile

import httpx

from celery_app import celery
from config import settings
from database import AsyncSessionLocal
from models import CallRecord, TranscriptionStatus
from tasks.summarization import summarize_call


async def call_whisper(audio_path: str, language: str | None, file_size_bytes: int) -> dict:
    provider = settings.WHISPER_PROVIDER
    if provider == "self-hosted":
        with open(audio_path, "rb") as f:
            audio_data = f.read()
        form = {"file": ("call.mp3", audio_data, "audio/mpeg")}
        if language:
            form["language"] = (None, language.lower())
        async with httpx.AsyncClient(timeout=600) as client:
            response = await client.post(
                f"{settings.WHISPER_SELF_HOSTED_URL}/transcribe",
                files=form,
                headers={"X-API-Key": settings.WHISPER_API_SECRET},
            )
            response.raise_for_status()
            return response.json()

    if provider != "openai":
        raise ValueError(f"Unsupported WHISPER_PROVIDER: {provider}")
    if not settings.OPENAI_WHISPER_API_KEY:
        raise ValueError("OPENAI_WHISPER_API_KEY is required when WHISPER_PROVIDER=openai")

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_WHISPER_API_KEY)
    with open(audio_path, "rb") as f:
        response = await client.audio.transcriptions.create(
            file=("call.mp3", f, "audio/mpeg"),
            model=settings.OPENAI_WHISPER_MODEL,
            language=language.lower() if language else None,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
            prompt="Customer support call. May include English and French.",
        )
    return {
        "text": response.text,
        "language": response.language or "en",
        "duration": response.duration or 0,
        "processing_time_seconds": 0,
    }


@celery.task(name="tasks.transcription.transcribe_call", bind=True, max_retries=3)
def transcribe_call(self, call_record_id: str) -> dict:
    try:
        return asyncio.run(_transcribe_call(call_record_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1)) from exc


async def _download(url: str, path: Path) -> int:
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.content
    if len(data) > settings.MAX_AUDIO_SIZE_MB * 1024 * 1024:
        raise ValueError(f"Recording exceeds {settings.MAX_AUDIO_SIZE_MB}MB")
    path.write_bytes(data)
    return len(data)


async def _transcribe_call(call_record_id: str) -> dict:
    async with AsyncSessionLocal() as db:
        record = await db.get(CallRecord, call_record_id)
        if not record:
            return {"ok": False, "reason": "not_found"}
        if (record.bill_seconds or 0) < 10:
            record.transcription_status = TranscriptionStatus.SKIPPED
            await db.commit()
            return {"ok": True, "status": "SKIPPED"}
        if not record.recording_url:
            record.transcription_status = TranscriptionStatus.FAILED
            record.transcription_error = "No recording URL"
            await db.commit()
            return {"ok": False, "reason": "no_recording_url"}

        record.transcription_status = TranscriptionStatus.DOWNLOADING
        await db.commit()

        with tempfile.TemporaryDirectory() as tmp:
            audio_path = Path(tmp) / "call.mp3"
            try:
                size = await _download(record.recording_url, audio_path)
                if settings.STORE_CALL_RECORDINGS:
                    storage = Path(settings.RECORDING_STORAGE_PATH)
                    storage.mkdir(parents=True, exist_ok=True)
                    stored = storage / f"{record.id}.mp3"
                    stored.write_bytes(audio_path.read_bytes())
                    record.recording_stored_url = str(stored)
                    record.recording_size = size
                record.transcription_status = TranscriptionStatus.TRANSCRIBING
                await db.commit()
                result = await call_whisper(str(audio_path), record.transcription_lang, size)
                record.transcription = result.get("text")
                record.transcription_lang = result.get("language", "en")
                record.transcription_model = settings.OPENAI_WHISPER_MODEL if settings.WHISPER_PROVIDER == "openai" else "faster-whisper"
                record.transcription_cost = round(((record.bill_seconds or 0) / 60) * 0.006, 4) if settings.WHISPER_PROVIDER == "openai" else 0
                record.transcription_status = TranscriptionStatus.SUMMARIZING
                await db.commit()
            except (httpx.HTTPError, ValueError, OSError) as exc:
                record.transcription_status = TranscriptionStatus.FAILED
                record.transcription_error = str(exc)
                await db.commit()
                return {"ok": False, "error": str(exc)}
        summarize_call.delay(record.id)
        return {"ok": True, "status": "SUMMARIZING"}
