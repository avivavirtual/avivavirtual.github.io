from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, request_ip
from middleware.rate_limit import limiter
from schemas import ForgotPasswordIn, LoginIn, RefreshIn, RegisterIn, ResetPasswordIn, TokenOut, UserOut
from services import auth_service

router = APIRouter()


@router.post("/register", response_model=TokenOut, status_code=201)
@limiter.limit("5/minute")
async def register(payload: RegisterIn, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_service.register(db, payload, request_ip(request), request.headers.get("user-agent"))


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
async def login(payload: LoginIn, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_service.login(db, payload, request_ip(request), request.headers.get("user-agent"))


@router.post("/refresh", response_model=TokenOut)
@limiter.limit("20/minute")
async def refresh(payload: RefreshIn, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_service.refresh(db, payload, request_ip(request), request.headers.get("user-agent"))


@router.post("/logout")
async def logout(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_service.logout(db, current_user)


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(payload: ForgotPasswordIn, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_service.forgot_password(db, payload)


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(payload: ResetPasswordIn, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await auth_service.reset_password(db, payload)


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return current_user
