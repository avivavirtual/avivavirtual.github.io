from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import AgentStatus, Conversation, ConversationStatus, Customer, Language, Message, SenderType, User
from schemas import AgentMessage, AssignConversation, RateConversation, WidgetMessage, WidgetStart
from services import ai_service
from services.notification_service import create_notification
from socketio_app import emit_conversation_updated, emit_new_message


async def list_conversations(db: AsyncSession, org_id: str, status: str | None = None, agent_id: str | None = None) -> list[Conversation]:
    query = select(Conversation).where(Conversation.organization_id == org_id)
    if status:
        query = query.where(Conversation.status == status)
    if agent_id:
        query = query.where(Conversation.assigned_agent_id == agent_id)
    rows = (await db.execute(query.order_by(Conversation.updated_at.desc()).limit(100))).scalars().all()
    return list(rows)


async def queue(db: AsyncSession, org_id: str) -> list[Conversation]:
    rows = (
        await db.execute(
            select(Conversation)
            .where(
                Conversation.organization_id == org_id,
                Conversation.assigned_agent_id.is_(None),
                Conversation.status.in_([ConversationStatus.PENDING, ConversationStatus.OPEN]),
            )
            .order_by(Conversation.created_at)
        )
    ).scalars().all()
    return list(rows)


async def get_conversation(db: AsyncSession, conversation_id: str, org_id: str) -> Conversation:
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.organization_id != org_id:
        raise HTTPException(404, "Conversation not found")
    return conv


async def message_history(db: AsyncSession, conversation_id: str, org_id: str) -> list[Message]:
    rows = (
        await db.execute(
            select(Message)
            .where(Message.organization_id == org_id, Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
    ).scalars().all()
    return list(rows)


async def start_widget(db: AsyncSession, org_id: str, payload: WidgetStart) -> dict:
    if not payload.consent:
        raise HTTPException(400, "PIPEDA consent is required before support starts")
    names = payload.name.split(" ", 1)
    customer = Customer(
        organization_id=org_id,
        first_name=names[0],
        last_name=names[1] if len(names) > 1 else "",
        email=payload.email,
        phone=payload.phone,
        language=payload.language,
        consent_given=True,
        consent_at=datetime.utcnow(),
    )
    db.add(customer)
    await db.flush()
    conversation = Conversation(organization_id=org_id, customer_id=customer.id, language=payload.language, status=ConversationStatus.OPEN)
    db.add(conversation)
    await db.flush()
    customer_msg = Message(organization_id=org_id, conversation_id=conversation.id, sender_type=SenderType.CUSTOMER, content=payload.message, language=payload.language)
    db.add(customer_msg)
    result = await ai_service.chat(db, org_id, payload.message, conversation)
    conversation.is_handed_off = result.should_handoff
    conversation.handoff_reason = "LOW_CONFIDENCE" if result.should_handoff else None
    conversation.updated_at = datetime.utcnow()
    ai_msg = Message(
        organization_id=org_id,
        conversation_id=conversation.id,
        sender_type=SenderType.AI,
        content=result.answer,
        language=Language(result.language),
        confidence=result.confidence,
    )
    db.add(ai_msg)
    if result.should_handoff:
        agents = (await db.execute(select(AgentStatus).where(AgentStatus.organization_id == org_id, AgentStatus.status == "AVAILABLE"))).scalars().all()
        for agent in agents:
            await create_notification(db, org_id, agent.user_id, "Support request needs review", payload.message[:160], "REVIEW", "conversation", conversation.id)
    await emit_new_message(conversation.id, {"id": customer_msg.id, "content": customer_msg.content, "sender_type": "CUSTOMER"})
    await emit_new_message(conversation.id, {"id": ai_msg.id, "content": ai_msg.content, "sender_type": "AI", "confidence": result.confidence})
    await emit_conversation_updated(org_id, conversation.model_dump())
    return {"conversation": conversation, "message": ai_msg, "should_handoff": result.should_handoff}


async def widget_message(db: AsyncSession, conv_id: str, payload: WidgetMessage) -> dict:
    conversation = await db.get(Conversation, conv_id)
    if not conversation:
        raise HTTPException(404, "Conversation not found")
    msg = Message(
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        sender_type=SenderType.CUSTOMER,
        content=payload.message,
        language=conversation.language,
    )
    db.add(msg)
    result = await ai_service.chat(db, conversation.organization_id, payload.message, conversation)
    conversation.is_handed_off = conversation.is_handed_off or result.should_handoff
    conversation.handoff_reason = "LOW_CONFIDENCE" if result.should_handoff else conversation.handoff_reason
    ai_msg = Message(
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        sender_type=SenderType.AI,
        content=result.answer,
        language=Language(result.language),
        confidence=result.confidence,
    )
    db.add(ai_msg)
    await emit_new_message(conversation.id, {"id": msg.id, "content": msg.content, "sender_type": "CUSTOMER"})
    await emit_new_message(conversation.id, {"id": ai_msg.id, "content": ai_msg.content, "sender_type": "AI"})
    return {"message": ai_msg, "should_handoff": result.should_handoff}


async def agent_message(db: AsyncSession, conversation_id: str, payload: AgentMessage, user: User) -> Message:
    conversation = await get_conversation(db, conversation_id, user.organization_id or "")
    msg = Message(
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        sender_type=SenderType.AGENT,
        sender_id=user.id,
        content=payload.content,
        is_internal=payload.is_internal,
        language=conversation.language,
    )
    conversation.status = ConversationStatus.ASSIGNED
    conversation.updated_at = datetime.utcnow()
    db.add(msg)
    await emit_new_message(conversation.id, {"id": msg.id, "content": msg.content, "sender_type": "AGENT"})
    return msg


async def assign(db: AsyncSession, conversation_id: str, payload: AssignConversation, org_id: str) -> Conversation:
    conversation = await get_conversation(db, conversation_id, org_id)
    conversation.assigned_agent_id = payload.agent_id
    conversation.status = ConversationStatus.ASSIGNED
    conversation.updated_at = datetime.utcnow()
    return conversation


async def close(db: AsyncSession, conversation_id: str, org_id: str) -> Conversation:
    conversation = await get_conversation(db, conversation_id, org_id)
    conversation.status = ConversationStatus.CLOSED
    conversation.closed_at = datetime.utcnow()
    conversation.updated_at = datetime.utcnow()
    return conversation


async def rate(db: AsyncSession, conversation_id: str, payload: RateConversation, org_id: str) -> Conversation:
    conversation = await get_conversation(db, conversation_id, org_id)
    conversation.rating = payload.rating
    conversation.updated_at = datetime.utcnow()
    return conversation
