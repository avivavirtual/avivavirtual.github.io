from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from services import analytics_service

router = APIRouter()


@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await analytics_service.overview(db, scoped_org(current_user))


@router.get("/agent-performance")
async def agent_performance(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await analytics_service.agent_performance(db, scoped_org(current_user))


@router.get("/ai-usage")
async def ai_usage(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await analytics_service.ai_usage(db, scoped_org(current_user))


@router.get("/sla-report")
async def sla_report(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await analytics_service.sla_report(db, scoped_org(current_user))


@router.get("/language-breakdown")
async def language_breakdown(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await analytics_service.language_breakdown(db, scoped_org(current_user))


@router.get("/transcription-costs")
async def transcription_costs(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await analytics_service.transcription_costs(db, scoped_org(current_user))
