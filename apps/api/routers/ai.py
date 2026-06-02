from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from services import ai_service

router = APIRouter()


class ChatIn(BaseModel):
    message: str


@router.post("/chat/{org_id}")
async def chat(org_id: str, payload: ChatIn, db: AsyncSession = Depends(get_db)):
    return (await ai_service.chat(db, org_id, payload.message)).__dict__


@router.post("/suggest-reply/{org_id}")
async def suggest_reply(org_id: str, payload: ChatIn, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ai_service.suggest_reply(db, org_id, payload.message)


@router.post("/index-article/{article_id}")
async def index_article(article_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await ai_service.index_article(db, article_id, current_user.organization_id or "")


@router.post("/summarize/{conversation_id}")
async def summarize(conversation_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return {"summary": await ai_service.summarize_conversation(db, conversation_id, current_user.organization_id or "")}
