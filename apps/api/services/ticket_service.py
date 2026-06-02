from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import SLAConfig, Ticket, TicketComment, TicketPriority, TicketStatus, User
from schemas import TicketAssign, TicketCommentCreate, TicketCreate, TicketPatch, TicketStatusPatch
from services.audit_service import audit
from socketio_app import emit_ticket_updated


def ticket_prefix(now: datetime | None = None) -> str:
    current = now or datetime.utcnow()
    return f"TKT-{current:%Y%m}"


async def next_ticket_number(db: AsyncSession, org_id: str) -> str:
    prefix = ticket_prefix()
    count = (
        await db.execute(
            select(func.count()).select_from(Ticket).where(Ticket.organization_id == org_id, Ticket.ticket_number.startswith(prefix))
        )
    ).scalar_one()
    return f"{prefix}-{int(count) + 1:04d}"


async def due_at_for(db: AsyncSession, org_id: str, priority: TicketPriority) -> datetime:
    config = (await db.execute(select(SLAConfig).where(SLAConfig.organization_id == org_id))).scalar_one_or_none()
    minutes = {
        TicketPriority.URGENT: config.urgent_response_minutes if config else 60,
        TicketPriority.HIGH: config.high_response_minutes if config else 240,
        TicketPriority.MEDIUM: config.medium_response_minutes if config else 480,
        TicketPriority.LOW: config.low_response_minutes if config else 1440,
    }[priority]
    return datetime.utcnow() + timedelta(minutes=minutes)


async def list_tickets(db: AsyncSession, org_id: str, status: TicketStatus | None = None, priority: TicketPriority | None = None, agent_id: str | None = None) -> list[Ticket]:
    query = select(Ticket).where(Ticket.organization_id == org_id)
    if status:
        query = query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
    if agent_id:
        query = query.where(Ticket.assigned_agent_id == agent_id)
    rows = (await db.execute(query.order_by(Ticket.created_at.desc()).limit(100))).scalars().all()
    return list(rows)


async def get_ticket(db: AsyncSession, ticket_id: str, org_id: str) -> Ticket:
    ticket = await db.get(Ticket, ticket_id)
    if not ticket or ticket.organization_id != org_id:
        raise HTTPException(404, "Ticket not found")
    return ticket


async def create_ticket(db: AsyncSession, payload: TicketCreate, user: User) -> Ticket:
    org_id = user.organization_id or ""
    ticket = Ticket(
        organization_id=org_id,
        ticket_number=await next_ticket_number(db, org_id),
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority,
        customer_id=payload.customer_id,
        conversation_id=payload.conversation_id,
        assigned_agent_id=payload.assigned_agent_id,
        due_at=await due_at_for(db, org_id, payload.priority),
    )
    db.add(ticket)
    await db.flush()
    await audit(db, "ticket.create", org_id, user.id, "ticket", ticket.id)
    return ticket


async def patch_ticket(db: AsyncSession, ticket_id: str, payload: TicketPatch, user: User) -> Ticket:
    ticket = await get_ticket(db, ticket_id, user.organization_id or "")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
    if payload.priority:
        ticket.due_at = await due_at_for(db, ticket.organization_id, payload.priority)
    ticket.updated_at = datetime.utcnow()
    return ticket


async def set_status(db: AsyncSession, ticket_id: str, payload: TicketStatusPatch, user: User) -> Ticket:
    ticket = await get_ticket(db, ticket_id, user.organization_id or "")
    ticket.status = payload.status
    if payload.status == TicketStatus.RESOLVED:
        ticket.resolved_at = datetime.utcnow()
    if payload.status == TicketStatus.CLOSED:
        ticket.closed_at = datetime.utcnow()
    ticket.updated_at = datetime.utcnow()
    await audit(db, "ticket.status_change", ticket.organization_id, user.id, "ticket", ticket.id, metadata_json=f'{{"status":"{payload.status}"}}')
    await emit_ticket_updated(ticket.organization_id, ticket.model_dump())
    return ticket


async def assign_ticket(db: AsyncSession, ticket_id: str, payload: TicketAssign, user: User) -> Ticket:
    ticket = await get_ticket(db, ticket_id, user.organization_id or "")
    ticket.assigned_agent_id = payload.agent_id
    ticket.updated_at = datetime.utcnow()
    return ticket


async def add_comment(db: AsyncSession, ticket_id: str, payload: TicketCommentCreate, user: User) -> TicketComment:
    ticket = await get_ticket(db, ticket_id, user.organization_id or "")
    comment = TicketComment(organization_id=ticket.organization_id, ticket_id=ticket.id, author_id=user.id, body=payload.body, is_internal=payload.is_internal)
    db.add(comment)
    return comment


async def delete_comment(db: AsyncSession, ticket_id: str, comment_id: str, user: User) -> dict:
    ticket = await get_ticket(db, ticket_id, user.organization_id or "")
    comment = await db.get(TicketComment, comment_id)
    if not comment or comment.ticket_id != ticket.id:
        raise HTTPException(404, "Comment not found")
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if comment.author_id != user.id and role not in ("SUPER_ADMIN", "CLIENT_ADMIN"):
        raise HTTPException(403, "Only the author or an admin can delete this comment")
    await db.delete(comment)
    return {"ok": True}


async def stats(db: AsyncSession, org_id: str) -> dict:
    rows = (await db.execute(select(Ticket.status, func.count()).where(Ticket.organization_id == org_id).group_by(Ticket.status))).all()
    return {str(status): int(count) for status, count in rows}
