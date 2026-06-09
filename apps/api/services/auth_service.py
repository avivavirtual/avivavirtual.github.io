from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any

from fastapi import HTTPException
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import AISettings, ChatWidget, ClientSettings, Organization, RefreshToken, SLAConfig, User, UserRole
from schemas import ForgotPasswordIn, LoginIn, RefreshIn, RegisterIn, ResetPasswordIn
from services.audit_service import audit
from services.email_service import send_email

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=settings.BCRYPT_ROUNDS)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def refresh_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def access_token_for(user: User) -> str:
    exp = int((datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_EXPIRES_IN)).timestamp())
    payload: dict[str, Any] = {
        "sub": user.id,
        "orgId": user.organization_id,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "exp": exp,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _utcnow_naive() -> datetime:
    """Naive UTC timestamp matching the naive `datetime` columns used for token expiry."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def _create_refresh(db: AsyncSession, user: User, ip_address: str | None, user_agent: str | None) -> str:
    token = secrets.token_urlsafe(48)
    db.add(
        RefreshToken(
            user_id=user.id,
            organization_id=user.organization_id,
            token_hash=refresh_hash(token),
            expires_at=_utcnow_naive() + timedelta(seconds=settings.JWT_REFRESH_EXPIRES_IN),
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )
    return token


async def register(
    db: AsyncSession,
    payload: RegisterIn,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Email already registered")

    org_name = payload.organization_name or f"{payload.first_name} {payload.last_name}".strip() or "New Business"
    slug_base = org_name.lower().replace(" ", "-").replace("_", "-")
    slug = "".join(c for c in slug_base if c.isalnum() or c == "-").strip("-") or "new-business"
    suffix = secrets.token_hex(3)
    org = Organization(name=org_name, slug=f"{slug}-{suffix}")
    db.add(org)
    await db.flush()
    db.add(ClientSettings(organization_id=org.id))
    db.add(ChatWidget(organization_id=org.id))
    db.add(SLAConfig(organization_id=org.id))
    db.add(AISettings(organization_id=org.id, confidence_threshold=settings.AI_CONFIDENCE_THRESHOLD))

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=UserRole.CLIENT_ADMIN,
        language=payload.language,
        organization_id=org.id,
        is_email_verified=False,
    )
    db.add(user)
    await db.flush()
    await audit(db, "auth.register", org.id, user.id, "user", user.id, ip_address, user_agent)
    refresh = await _create_refresh(db, user, ip_address, user_agent)
    return {"access_token": access_token_for(user), "refresh_token": refresh, "expires_in": settings.JWT_EXPIRES_IN, "user": user}


async def login(db: AsyncSession, payload: LoginIn, ip_address: str | None, user_agent: str | None) -> dict:
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    await audit(db, "auth.login", user.organization_id, user.id, "user", user.id, ip_address, user_agent)
    refresh = await _create_refresh(db, user, ip_address, user_agent)
    return {"access_token": access_token_for(user), "refresh_token": refresh, "expires_in": settings.JWT_EXPIRES_IN, "user": user}


async def refresh(db: AsyncSession, payload: RefreshIn, ip_address: str | None, user_agent: str | None) -> dict:
    token_hash = refresh_hash(payload.refresh_token)
    stored = (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))).scalar_one_or_none()
    if not stored or stored.revoked_at or stored.expires_at < _utcnow_naive():
        raise HTTPException(401, "Invalid refresh token")
    user = await db.get(User, stored.user_id)
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid refresh token")
    new_refresh = await _create_refresh(db, user, ip_address, user_agent)
    stored.revoked_at = datetime.utcnow()
    stored.replaced_by_token_hash = refresh_hash(new_refresh)
    return {"access_token": access_token_for(user), "refresh_token": new_refresh, "expires_in": settings.JWT_EXPIRES_IN, "user": user}


async def logout(db: AsyncSession, user: User) -> dict:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.utcnow(), updated_at=datetime.utcnow())
    )
    await audit(db, "auth.logout", user.organization_id, user.id, "user", user.id)
    return {"ok": True}


async def forgot_password(db: AsyncSession, payload: ForgotPasswordIn) -> dict:
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = refresh_hash(token)
        user.password_reset_expiry = _utcnow_naive() + timedelta(hours=1)
        user.updated_at = datetime.utcnow()
        reset_url = f"{settings.WEB_APP_URL}/reset-password?token={token}"
        await send_email(
            user.email,
            "Reset your Avivavirtual password",
            f"<p>We received a request to reset your password.</p>"
            f'<p><a href="{reset_url}">Click here to choose a new password</a>. '
            f"This link expires in 1 hour.</p>"
            f"<p>If you didn't request this, you can safely ignore this email.</p>",
            f"Reset your password: {reset_url} (expires in 1 hour)",
        )
    return {"ok": True}


async def reset_password(db: AsyncSession, payload: ResetPasswordIn) -> dict:
    user = (
        await db.execute(
            select(User).where(
                User.password_reset_token == refresh_hash(payload.token),
                User.password_reset_expiry > _utcnow_naive(),
            )
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(400, "Invalid or expired reset token")
    user.password_hash = hash_password(payload.password)
    user.password_reset_token = None
    user.password_reset_expiry = None
    user.updated_at = datetime.utcnow()
    await audit(db, "auth.password_reset", user.organization_id, user.id, "user", user.id)
    return {"ok": True}
