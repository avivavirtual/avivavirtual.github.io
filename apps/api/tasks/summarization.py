import asyncio
from datetime import datetime

from celery_app import celery
from config import settings
from database import AsyncSessionLocal
from models import CallRecord, Conversation, Message, Notification, SenderType, TranscriptionStatus
from socketio_app import emit_call_transcript_ready


@celery.task(name="tasks.summarization.summarize_call", bind=True, max_retries=3)
def summarize_call(self, call_record_id: str) -> dict:
    try:
        return asyncio.run(_summarize_call(call_record_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1)) from exc


def local_summary(transcript: str, language: str | None) -> str:
    intro = "Résumé" if language == "fr" else "Summary"
    trimmed = transcript.replace("\n", " ")[:600]
    return f"{intro}: ISSUE: {trimmed[:180]} ACTIONS: Support reviewed the call and documented next steps. OUTCOME: Follow-up is required if the ticket remains open."


async def _gemini_summary(transcript: str, language: str | None) -> str:
    if not settings.GEMINI_API_KEY:
        return local_summary(transcript, language)
    from openai import AsyncOpenAI

    prompt = (
        "Summarize in exactly 3 sentences: ISSUE, ACTIONS, OUTCOME. Plain text only."
        if language != "fr"
        else "Résumez en exactement 3 phrases: PROBLÈME, ACTIONS, RÉSULTAT. Texte brut seulement."
    )
    client = AsyncOpenAI(api_key=settings.GEMINI_API_KEY, base_url=settings.GEMINI_OPENAI_BASE_URL)
    response = await client.chat.completions.create(
        model=settings.GEMINI_MODEL,
        messages=[{"role": "system", "content": prompt}, {"role": "user", "content": transcript}],
        max_tokens=300,
        temperature=0.2,
    )
    return response.choices[0].message.content or local_summary(transcript, language)


async def _summarize_call(call_record_id: str) -> dict:
    async with AsyncSessionLocal() as db:
        record = await db.get(CallRecord, call_record_id)
        if not record or not record.transcription:
            return {"ok": False, "reason": "missing_transcript"}
        summary = await _gemini_summary(record.transcription, record.transcription_lang)
        record.summary = summary
        record.summary_at = datetime.utcnow()
        record.summary_model = settings.GEMINI_MODEL if settings.GEMINI_API_KEY else "local-rule"
        record.transcription_status = TranscriptionStatus.COMPLETED
        if record.conversation_id:
            conversation = await db.get(Conversation, record.conversation_id)
            if conversation:
                conversation.ai_summary = summary
                db.add(
                    Message(
                        organization_id=record.organization_id,
                        conversation_id=conversation.id,
                        sender_type=SenderType.SYSTEM,
                        content=summary,
                        is_internal=True,
                    )
                )
        if record.agent_id:
            db.add(
                Notification(
                    organization_id=record.organization_id,
                    user_id=record.agent_id,
                    title="Call transcript ready",
                    body=summary[:200],
                    type="TRANSCRIPT",
                    entity_type="call_record",
                    entity_id=record.id,
                )
            )
            await emit_call_transcript_ready(record.agent_id, {"callRecordId": record.id, "summary": summary})
        await db.commit()
        return {"ok": True, "summary": summary}
