from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models import Notification


async def create_notification(
    db: AsyncSession,
    organization_id: str,
    user_id: str,
    title: str,
    body: str,
    type_: str = "INFO",
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> Notification:
    notification = Notification(
        organization_id=organization_id,
        user_id=user_id,
        title=title,
        body=body,
        type=type_,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(notification)
    return notification


async def list_notifications(db: AsyncSession, organization_id: str, user_id: str) -> list[Notification]:
    rows = (
        await db.execute(
            select(Notification)
            .where(Notification.organization_id == organization_id, Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return list(rows)


async def mark_read(db: AsyncSession, notification_id: str, organization_id: str, user_id: str) -> Notification | None:
    item = (
        await db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.organization_id == organization_id,
                Notification.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if item:
        item.is_read = True
        item.read_at = datetime.utcnow()
    return item


async def mark_all_read(db: AsyncSession, organization_id: str, user_id: str) -> dict:
    await db.execute(
        update(Notification)
        .where(Notification.organization_id == organization_id, Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=datetime.utcnow(), updated_at=datetime.utcnow())
    )
    return {"ok": True}
