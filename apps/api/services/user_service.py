from datetime import datetime
import secrets

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import AgentSipCredentials, AgentStatus, User, UserRole
from schemas import AgentStatusPatch, UserCreate, UserPatch
from services.audit_service import audit
from services.auth_service import hash_password
from services.voipms_service import create_sub_account, del_sub_account, encrypt_secret


async def list_users(db: AsyncSession, org_id: str, page: int = 1, page_size: int = 25) -> tuple[list[User], int]:
    base = select(User).where(User.organization_id == org_id).order_by(User.created_at.desc())
    total = (await db.execute(select(func.count()).select_from(User).where(User.organization_id == org_id))).scalar_one()
    rows = (await db.execute(base.offset((page - 1) * page_size).limit(page_size))).scalars().all()
    return list(rows), int(total)


async def get_user(db: AsyncSession, user_id: str, org_id: str | None = None) -> User:
    user = await db.get(User, user_id)
    if not user or (org_id and user.organization_id != org_id):
        raise HTTPException(404, "User not found")
    return user


async def create_user(db: AsyncSession, payload: UserCreate, actor: User) -> User:
    org_id = payload.organization_id or actor.organization_id
    if not org_id:
        raise HTTPException(400, "organization_id is required")
    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        phone=payload.phone,
        language=payload.language,
        organization_id=org_id,
    )
    db.add(user)
    await db.flush()
    if user.role == UserRole.AGENT:
        await provision_agent_sip(db, user)
    await audit(db, "agent.create" if user.role == UserRole.AGENT else "user.create", org_id, actor.id, "user", user.id)
    return user


async def provision_agent_sip(db: AsyncSession, user: User) -> AgentSipCredentials:
    username = f"{user.email.split('@')[0].replace('.', '')[:18]}{secrets.randbelow(999):03d}"
    password = secrets.token_urlsafe(18)
    sub_account = await create_sub_account(username, password, f"Avivavirtual agent {user.email}", settings.VOIPMS_DID)
    creds = AgentSipCredentials(
        organization_id=user.organization_id or "",
        user_id=user.id,
        sip_username=sub_account,
        sip_password=encrypt_secret(password),
        sub_account=sub_account,
    )
    db.add(creds)
    db.add(AgentStatus(organization_id=user.organization_id or "", user_id=user.id, status="OFFLINE"))
    return creds


async def patch_user(db: AsyncSession, user_id: str, payload: UserPatch, org_id: str | None) -> User:
    user = await get_user(db, user_id, org_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    user.updated_at = datetime.utcnow()
    return user


async def soft_delete_user(db: AsyncSession, user_id: str, actor: User, org_id: str | None) -> dict:
    user = await get_user(db, user_id, org_id)
    user.is_active = False
    user.updated_at = datetime.utcnow()
    creds = (await db.execute(select(AgentSipCredentials).where(AgentSipCredentials.user_id == user.id))).scalar_one_or_none()
    if creds and creds.is_active:
        await del_sub_account(creds.sub_account)
        creds.is_active = False
        creds.updated_at = datetime.utcnow()
    await audit(db, "agent.deactivate" if user.role == UserRole.AGENT else "user.deactivate", user.organization_id, actor.id, "user", user.id)
    return {"ok": True}


async def update_agent_status(db: AsyncSession, user_id: str, payload: AgentStatusPatch, org_id: str) -> AgentStatus:
    status = (await db.execute(select(AgentStatus).where(AgentStatus.user_id == user_id, AgentStatus.organization_id == org_id))).scalar_one_or_none()
    if not status:
        status = AgentStatus(organization_id=org_id, user_id=user_id)
        db.add(status)
    status.status = payload.status
    status.last_seen_at = datetime.utcnow()
    status.updated_at = datetime.utcnow()
    return status


async def available_agents(db: AsyncSession, org_id: str) -> list[User]:
    rows = (
        await db.execute(
            select(User)
            .join(AgentStatus, AgentStatus.user_id == User.id)
            .where(User.organization_id == org_id, User.role == UserRole.AGENT, User.is_active.is_(True), AgentStatus.status == "AVAILABLE")
            .order_by(User.first_name)
        )
    ).scalars().all()
    return list(rows)
