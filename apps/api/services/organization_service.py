from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ChatWidget, ClientSettings, Organization, User, UserRole
from schemas import ClientSettingsPatch, OrganizationCreate, OrganizationPatch, WidgetConfigPatch
from services.audit_service import audit


async def list_organizations(db: AsyncSession, user: User) -> list[Organization]:
    if user.role == UserRole.SUPER_ADMIN:
        rows = (await db.execute(select(Organization).order_by(Organization.created_at.desc()))).scalars().all()
        return list(rows)
    if not user.organization_id:
        return []
    org = await db.get(Organization, user.organization_id)
    return [org] if org else []


async def get_organization(db: AsyncSession, org_id: str, user: User | None = None) -> Organization:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    if user and user.role != UserRole.SUPER_ADMIN and user.organization_id != org.id:
        raise HTTPException(403, "Cross-tenant access denied")
    return org


async def create_organization(db: AsyncSession, payload: OrganizationCreate, actor: User) -> Organization:
    existing = (await db.execute(select(Organization).where(Organization.slug == payload.slug))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Slug already exists")
    org = Organization(**payload.model_dump())
    db.add(org)
    await db.flush()
    db.add(ClientSettings(organization_id=org.id))
    db.add(ChatWidget(organization_id=org.id))
    await audit(db, "organization.create", org.id, actor.id, "organization", org.id)
    return org


async def patch_organization(db: AsyncSession, org_id: str, payload: OrganizationPatch, actor: User) -> Organization:
    org = await get_organization(db, org_id, actor)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(org, key, value)
    org.updated_at = datetime.utcnow()
    await audit(db, "organization.update", org.id, actor.id, "organization", org.id)
    return org


async def get_settings(db: AsyncSession, org_id: str, user: User) -> ClientSettings:
    await get_organization(db, org_id, user)
    settings = (await db.execute(select(ClientSettings).where(ClientSettings.organization_id == org_id))).scalar_one_or_none()
    if not settings:
        settings = ClientSettings(organization_id=org_id)
        db.add(settings)
    return settings


async def patch_settings(db: AsyncSession, org_id: str, payload: ClientSettingsPatch, actor: User) -> ClientSettings:
    settings = await get_settings(db, org_id, actor)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    settings.updated_at = datetime.utcnow()
    await audit(db, "organization.settings.update", org_id, actor.id, "client_settings", settings.id)
    return settings


async def get_widget(db: AsyncSession, org_id: str) -> ChatWidget:
    widget = (await db.execute(select(ChatWidget).where(ChatWidget.organization_id == org_id))).scalar_one_or_none()
    if not widget:
        widget = ChatWidget(organization_id=org_id)
        db.add(widget)
    return widget


async def patch_widget(db: AsyncSession, org_id: str, payload: WidgetConfigPatch, actor: User) -> ChatWidget:
    widget = await get_widget(db, org_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(widget, key, value)
    widget.updated_at = datetime.utcnow()
    await audit(db, "organization.widget.update", org_id, actor.id, "chat_widget", widget.id)
    return widget
