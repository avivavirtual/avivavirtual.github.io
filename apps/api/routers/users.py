from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_roles
from middleware.tenant import scoped_org
from schemas import AgentStatusPatch, UserCreate, UserList, UserPatch
from services import user_service
from socketio_app import emit_agent_status_changed

router = APIRouter()


@router.get("", response_model=UserList)
async def list_users(page: int = 1, page_size: int = 25, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = scoped_org(current_user)
    items, total = await user_service.list_users(db, org_id, page, page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/agents")
async def agents(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await user_service.available_agents(db, scoped_org(current_user))


@router.get("/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return await user_service.get_user(db, user_id, None if role == "SUPER_ADMIN" else scoped_org(current_user))


@router.post("", status_code=201)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_roles("SUPER_ADMIN", "CLIENT_ADMIN"))):
    return await user_service.create_user(db, payload, current_user)


@router.patch("/{user_id}")
async def patch_user(user_id: str, payload: UserPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return await user_service.patch_user(db, user_id, payload, None if role == "SUPER_ADMIN" else scoped_org(current_user))


@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_roles("SUPER_ADMIN", "CLIENT_ADMIN"))):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return await user_service.soft_delete_user(db, user_id, current_user, None if role == "SUPER_ADMIN" else scoped_org(current_user))


@router.patch("/{user_id}/status")
async def status(user_id: str, payload: AgentStatusPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = scoped_org(current_user)
    item = await user_service.update_agent_status(db, user_id, payload, org_id)
    await emit_agent_status_changed(org_id, user_id, payload.status)
    return item
