from datetime import datetime
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import User

bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise exc
    except JWTError:
        raise exc

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise exc
    user.last_login_at = user.last_login_at or datetime.utcnow()
    return user


def require_roles(*roles: str) -> Callable[..., object]:
    async def check(current_user: User = Depends(get_current_user)) -> User:
        current_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if current_role not in roles:
            raise HTTPException(status_code=403, detail=f"Requires one of: {', '.join(roles)}")
        return current_user

    return check


def request_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    return (forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else "")


RequireAuth = Depends(get_current_user)
RequireSuperAdmin = Depends(require_roles("SUPER_ADMIN"))
RequireAdmin = Depends(require_roles("SUPER_ADMIN", "CLIENT_ADMIN"))
RequireAgent = Depends(require_roles("SUPER_ADMIN", "CLIENT_ADMIN", "AGENT"))
