from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from services import conversation_service

router = APIRouter()


@router.get("/conversation/{conversation_id}")
async def list_messages(conversation_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await conversation_service.message_history(db, conversation_id, scoped_org(current_user))
