from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_roles
from schemas import ClientSettingsPatch, OrganizationCreate, OrganizationPatch, WidgetConfigPatch
from services import organization_service

router = APIRouter()


@router.get("")
async def list_organizations(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await organization_service.list_organizations(db, current_user)


@router.get("/{org_id}")
async def get_organization(org_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await organization_service.get_organization(db, org_id, current_user)


@router.post("", status_code=201)
async def create_organization(payload: OrganizationCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_roles("SUPER_ADMIN"))):
    return await organization_service.create_organization(db, payload, current_user)


@router.patch("/{org_id}")
async def patch_organization(org_id: str, payload: OrganizationPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await organization_service.patch_organization(db, org_id, payload, current_user)


@router.get("/{org_id}/settings")
async def get_settings(org_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await organization_service.get_settings(db, org_id, current_user)


@router.patch("/{org_id}/settings")
async def patch_settings(org_id: str, payload: ClientSettingsPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await organization_service.patch_settings(db, org_id, payload, current_user)


@router.get("/{org_id}/widget")
async def get_widget(org_id: str, db: AsyncSession = Depends(get_db)):
    return await organization_service.get_widget(db, org_id)


@router.patch("/{org_id}/widget")
async def patch_widget(org_id: str, payload: WidgetConfigPatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await organization_service.patch_widget(db, org_id, payload, current_user)
