from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from schemas import TicketAssign, TicketCommentCreate, TicketCreate, TicketPatch, TicketStatusPatch
from services import file_service, ticket_service

router = APIRouter()


@router.get("")
async def list_tickets(status: str | None = None, priority: str | None = None, agent_id: str | None = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.list_tickets(db, scoped_org(current_user), status, priority, agent_id)


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.stats(db, scoped_org(current_user))


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.get_ticket(db, ticket_id, scoped_org(current_user))


@router.post("", status_code=201)
async def create_ticket(payload: TicketCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.create_ticket(db, payload, current_user)


@router.patch("/{ticket_id}")
async def patch_ticket(ticket_id: str, payload: TicketPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.patch_ticket(db, ticket_id, payload, current_user)


@router.patch("/{ticket_id}/status")
async def set_status(ticket_id: str, payload: TicketStatusPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.set_status(db, ticket_id, payload, current_user)


@router.patch("/{ticket_id}/assign")
async def assign_ticket(ticket_id: str, payload: TicketAssign, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.assign_ticket(db, ticket_id, payload, current_user)


@router.post("/{ticket_id}/comments", status_code=201)
async def add_comment(ticket_id: str, payload: TicketCommentCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.add_comment(db, ticket_id, payload, current_user)


@router.delete("/{ticket_id}/comments/{comment_id}")
async def delete_comment(ticket_id: str, comment_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ticket_service.delete_comment(db, ticket_id, comment_id, current_user)


@router.post("/{ticket_id}/attachments", status_code=201)
async def attachments(ticket_id: str, file: UploadFile, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await ticket_service.get_ticket(db, ticket_id, scoped_org(current_user))
    stored = await file_service.store_upload(file)
    return {"ticket_id": ticket_id, **stored}
