from fastapi import HTTPException

from models import User, UserRole


def user_org_id(user: User) -> str:
    if not user.organization_id:
        raise HTTPException(403, "User is not assigned to an organization")
    return user.organization_id


def ensure_same_org(user: User, organization_id: str | None) -> str:
    if user.role == UserRole.SUPER_ADMIN:
        if not organization_id:
            raise HTTPException(400, "organization_id is required")
        return organization_id
    if not user.organization_id or user.organization_id != organization_id:
        raise HTTPException(403, "Cross-tenant access denied")
    return user.organization_id


def scoped_org(user: User, requested_org_id: str | None = None) -> str:
    if user.role == UserRole.SUPER_ADMIN:
        return requested_org_id or user.organization_id or ""
    return user_org_id(user)
