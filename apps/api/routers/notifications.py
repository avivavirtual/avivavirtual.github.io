from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from services import notification_service

router = APIRouter()


@router.get("")
async def list_notifications(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await notification_service.list_notifications(db, scoped_org(current_user), current_user.id)


@router.patch("/{notification_id}/read")
async def read(notification_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    item = await notification_service.mark_read(db, notification_id, scoped_org(current_user), current_user.id)
    if not item:
        raise HTTPException(404, "Notification not found")
    return item


@router.patch("/read-all")
async def read_all(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await notification_service.mark_all_read(db, scoped_org(current_user), current_user.id)
