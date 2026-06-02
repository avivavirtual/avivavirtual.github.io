from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_roles
from models import AuditLog

router = APIRouter()


@router.get("")
async def list_audit_logs(action: str | None = None, organization_id: str | None = None, db: AsyncSession = Depends(get_db), current_user=Depends(require_roles("SUPER_ADMIN"))):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if organization_id:
        query = query.where(AuditLog.organization_id == organization_id)
    rows = (await db.execute(query.order_by(AuditLog.created_at.desc()).limit(250))).scalars().all()
    return list(rows)
