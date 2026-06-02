from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from schemas import AgentMessage, AssignConversation, RateConversation, WidgetMessage, WidgetStart
from services import conversation_service

router = APIRouter()


@router.get("")
async def list_conversations(status: str | None = None, agent_id: str | None = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.list_conversations(db, scoped_org(current_user), status, agent_id)


@router.get("/queue")
async def queue(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.queue(db, scoped_org(current_user))


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    conv = await conversation_service.get_conversation(db, conversation_id, scoped_org(current_user))
    messages = await conversation_service.message_history(db, conversation_id, scoped_org(current_user))
    return {"conversation": conv, "messages": messages}


@router.post("/widget/{org_id}", status_code=201)
async def start_widget(org_id: str, payload: WidgetStart, db: AsyncSession = Depends(get_db)):
    return await conversation_service.start_widget(db, org_id, payload)


@router.post("/widget/{conv_id}/message")
async def widget_message(conv_id: str, payload: WidgetMessage, db: AsyncSession = Depends(get_db)):
    return await conversation_service.widget_message(db, conv_id, payload)


@router.post("/{conversation_id}/messages")
async def agent_message(conversation_id: str, payload: AgentMessage, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.agent_message(db, conversation_id, payload, current_user)


@router.patch("/{conversation_id}/assign")
async def assign(conversation_id: str, payload: AssignConversation, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.assign(db, conversation_id, payload, scoped_org(current_user))


@router.patch("/{conversation_id}/close")
async def close(conversation_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.close(db, conversation_id, scoped_org(current_user))


@router.patch("/{conversation_id}/rate")
async def rate(conversation_id: str, payload: RateConversation, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.rate(db, conversation_id, payload, scoped_org(current_user))
