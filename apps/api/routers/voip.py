from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from models import AgentSipCredentials, CallRecord, CallbackRequest, Organization, TranscriptionStatus
from schemas import CallbackCreate
from services.audit_service import audit
from services.voipms_service import decrypt_secret, get_dids_info, get_sub_accounts

router = APIRouter()


@router.post("/credentials/{agent_id}")
async def credentials(agent_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = scoped_org(current_user)
    creds = (
        await db.execute(
            select(AgentSipCredentials).where(
                AgentSipCredentials.organization_id == org_id,
                AgentSipCredentials.user_id == agent_id,
                AgentSipCredentials.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if not creds:
        raise HTTPException(404, "SIP credentials not found")
    return {
        "username": creds.sip_username,
        "password": decrypt_secret(creds.sip_password),
        "displayName": current_user.first_name,
        "server": settings.VOIPMS_WEBRTC_SERVER,
    }


@router.get("/call-records")
async def call_records(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    rows = (
        await db.execute(select(CallRecord).where(CallRecord.organization_id == scoped_org(current_user)).order_by(CallRecord.created_at.desc()).limit(100))
    ).scalars().all()
    return list(rows)


@router.get("/call-records/{call_record_id}/transcript")
async def transcript(call_record_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    record = await db.get(CallRecord, call_record_id)
    if not record or record.organization_id != scoped_org(current_user):
        raise HTTPException(404, "Call record not found")
    return {"transcription": record.transcription, "summary": record.summary, "status": record.transcription_status}


@router.get("/call-records/{call_record_id}/recording")
async def recording(call_record_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    record = await db.get(CallRecord, call_record_id)
    if not record or record.organization_id != scoped_org(current_user):
        raise HTTPException(404, "Call record not found")
    return {"recording_url": record.recording_stored_url or record.recording_url}


@router.post("/call-records/{call_record_id}/retry-transcription")
async def retry_transcription(call_record_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    record = await db.get(CallRecord, call_record_id)
    if not record or record.organization_id != scoped_org(current_user):
        raise HTTPException(404, "Call record not found")
    record.transcription_status = TranscriptionStatus.QUEUED
    record.transcription_error = None
    record.updated_at = datetime.utcnow()
    return record


@router.delete("/call-records/{call_record_id}/recording")
async def delete_recording(call_record_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    record = await db.get(CallRecord, call_record_id)
    if not record or record.organization_id != scoped_org(current_user):
        raise HTTPException(404, "Call record not found")
    record.recording_stored_url = None
    record.recording_url = None
    record.updated_at = datetime.utcnow()
    await audit(db, "call_recording.deleted", record.organization_id, current_user.id, "call_record", record.id)
    return {"ok": True}


@router.get("/callback-requests")
async def callback_requests(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    rows = (
        await db.execute(select(CallbackRequest).where(CallbackRequest.organization_id == scoped_org(current_user)).order_by(CallbackRequest.created_at.desc()))
    ).scalars().all()
    return list(rows)


@router.post("/callback-requests", status_code=201)
async def callback_request(payload: CallbackCreate, organization_id: str, db: AsyncSession = Depends(get_db)):
    if not await db.get(Organization, organization_id):
        raise HTTPException(404, "Organization not found")
    item = CallbackRequest(organization_id=organization_id, **payload.model_dump())
    db.add(item)
    return item


@router.patch("/callback-requests/{callback_id}/complete")
async def complete_callback(callback_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    item = await db.get(CallbackRequest, callback_id)
    if not item or item.organization_id != scoped_org(current_user):
        raise HTTPException(404, "Callback request not found")
    item.status = "COMPLETED"
    item.completed_at = datetime.utcnow()
    return item


@router.get("/did-status")
async def did_status(current_user=Depends(get_current_user)):
    return await get_dids_info(settings.VOIPMS_DID)


@router.get("/sub-accounts")
async def sub_accounts(current_user=Depends(get_current_user)):
    return await get_sub_accounts()


@router.get("/transcription-stats")
async def transcription_stats(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    rows = (
        await db.execute(
            select(CallRecord.transcription_status, func.count()).where(CallRecord.organization_id == scoped_org(current_user)).group_by(CallRecord.transcription_status)
        )
    ).all()
    return {str(status): int(count) for status, count in rows}
