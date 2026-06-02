from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from models import Language, UserRole
from schemas.auth import UserOut


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    role: UserRole
    phone: Optional[str] = None
    language: Language = Language.EN
    organization_id: Optional[str] = None


class UserPatch(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[Language] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class AgentStatusPatch(BaseModel):
    status: str = Field(pattern="^(AVAILABLE|BUSY|AWAY|OFFLINE)$")


class UserList(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    page_size: int
