import asyncio
from datetime import datetime, timedelta

from redis import Redis
from sqlalchemy import select

from celery_app import celery
from config import settings
from database import AsyncSessionLocal
from models import CallRecord, Customer, TranscriptionStatus
from services.voipms_service import get_cdr
from tasks.transcription import transcribe_call

redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)


@celery.task(name="tasks.cdr_sync.sync_cdr")
def sync_cdr() -> dict:
    return asyncio.run(_sync_cdr())


async def _sync_cdr() -> dict:
    last_sync = redis.get("voipms:last_cdr_sync")
    date_from = datetime.fromisoformat(last_sync) if last_sync else datetime.utcnow() - timedelta(hours=2)
    date_to = datetime.utcnow()
    records = await get_cdr(date_from.strftime("%Y-%m-%d"), date_to.strftime("%Y-%m-%d"))
    queued = 0
    async with AsyncSessionLocal() as db:
        for item in records:
            sip_call_id = str(item.get("uniqueid") or item.get("callid") or item.get("id") or "")
            if not sip_call_id:
                continue
            existing = (await db.execute(select(CallRecord).where(CallRecord.sip_call_id == sip_call_id))).scalar_one_or_none()
            if existing:
                record = existing
            else:
                from_number = str(item.get("callerid") or item.get("src") or "")
                customer = (await db.execute(select(Customer).where(Customer.phone == from_number))).scalar_one_or_none()
                org_id = customer.organization_id if customer else "unassigned"
                record = CallRecord(
                    organization_id=org_id,
                    customer_id=customer.id if customer else None,
                    sip_call_id=sip_call_id,
                    direction=str(item.get("direction") or "inbound"),
                    from_number=from_number,
                    to_number=str(item.get("destination") or item.get("dst") or settings.VOIPMS_DID),
                )
                db.add(record)
            record.bill_seconds = int(item.get("seconds") or item.get("billseconds") or 0)
            record.disposition = item.get("disposition")
            record.cost = float(item.get("total") or item.get("cost") or 0)
            record.recording_url = item.get("recording") or item.get("recording_url")
            if record.recording_url and (record.bill_seconds or 0) > 10 and record.transcription_status == TranscriptionStatus.PENDING:
                record.transcription_status = TranscriptionStatus.QUEUED
                transcribe_call.apply_async(args=[record.id], countdown=120)
                queued += 1
        await db.commit()
    redis.set("voipms:last_cdr_sync", date_to.isoformat())
    return {"processed": len(records), "queued": queued}
