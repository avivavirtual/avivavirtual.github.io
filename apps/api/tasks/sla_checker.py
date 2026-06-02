import asyncio
from datetime import datetime

from sqlalchemy import select

from celery_app import celery
from database import AsyncSessionLocal
from models import Notification, Ticket, TicketStatus
from services.audit_service import audit
from socketio_app import emit_ticket_updated


@celery.task(name="tasks.sla_checker.check_sla_breaches")
def check_sla_breaches() -> dict:
    return asyncio.run(_check_sla_breaches())


async def _check_sla_breaches() -> dict:
    async with AsyncSessionLocal() as db:
        rows = (
            await db.execute(
                select(Ticket).where(
                    Ticket.status.notin_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
                    Ticket.due_at < datetime.utcnow(),
                    Ticket.sla_breached.is_(False),
                )
            )
        ).scalars().all()
        for ticket in rows:
            ticket.sla_breached = True
            if ticket.assigned_agent_id:
                db.add(
                    Notification(
                        organization_id=ticket.organization_id,
                        user_id=ticket.assigned_agent_id,
                        title="SLA breached",
                        body=ticket.subject,
                        type="SLA",
                        entity_type="ticket",
                        entity_id=ticket.id,
                    )
                )
            await audit(db, "ticket.sla_breached", ticket.organization_id, None, "ticket", ticket.id)
            await emit_ticket_updated(ticket.organization_id, ticket.model_dump())
        await db.commit()
        return {"breached": len(rows)}
