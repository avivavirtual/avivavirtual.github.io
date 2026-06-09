from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import CallRecord, Conversation, Message, Ticket


async def overview(db: AsyncSession, org_id: str) -> dict:
    conversations = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.organization_id == org_id))).scalar_one()
    tickets = (await db.execute(select(func.count()).select_from(Ticket).where(Ticket.organization_id == org_id))).scalar_one()
    calls = (await db.execute(select(func.count()).select_from(CallRecord).where(CallRecord.organization_id == org_id))).scalar_one()
    return {
        "metrics": [
            {"label": "Conversations", "value": int(conversations), "trend": "+0%"},
            {"label": "Tickets", "value": int(tickets), "trend": "+0%"},
            {"label": "Call records", "value": int(calls), "trend": "+0%"},
        ]
    }


async def agent_performance(db: AsyncSession, org_id: str) -> dict:
    rows = (await db.execute(select(Ticket.assigned_agent_id, func.count()).where(Ticket.organization_id == org_id).group_by(Ticket.assigned_agent_id))).all()
    return {"agents": [{"agent_id": agent_id, "tickets": int(count)} for agent_id, count in rows]}


async def ai_usage(db: AsyncSession, org_id: str) -> dict:
    tokens = (await db.execute(select(func.coalesce(func.sum(Message.tokens_used), 0)).where(Message.organization_id == org_id))).scalar_one()
    handoffs = (await db.execute(select(func.count()).select_from(Conversation).where(Conversation.organization_id == org_id, Conversation.is_handed_off.is_(True)))).scalar_one()
    return {"tokens": int(tokens), "handoffs": int(handoffs), "average_confidence": 0.75}


async def sla_report(db: AsyncSession, org_id: str) -> dict:
    breached = (await db.execute(select(func.count()).select_from(Ticket).where(Ticket.organization_id == org_id, Ticket.sla_breached.is_(True)))).scalar_one()
    return {"breached": int(breached)}


async def language_breakdown(db: AsyncSession, org_id: str) -> dict:
    rows = (await db.execute(select(Conversation.language, func.count()).where(Conversation.organization_id == org_id).group_by(Conversation.language))).all()
    return {"languages": {str(language): int(count) for language, count in rows}}


async def transcription_costs(db: AsyncSession, org_id: str) -> dict:
    cost = (await db.execute(select(func.coalesce(func.sum(CallRecord.transcription_cost), 0)).where(CallRecord.organization_id == org_id))).scalar_one()
    return {"month_cost_cad": float(cost), "provider": "self-hosted/openai"}
