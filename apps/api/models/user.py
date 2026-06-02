from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    CLIENT_ADMIN = "CLIENT_ADMIN"
    AGENT = "AGENT"
    CUSTOMER = "CUSTOMER"


class Language(str, Enum):
    EN = "EN"
    FR = "FR"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    first_name: str
    last_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    language: Language = Language.EN
    is_active: bool = True
    is_email_verified: bool = False
    email_verify_token: Optional[str] = None
    password_reset_token: Optional[str] = None
    password_reset_expiry: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    organization_id: Optional[str] = Field(default=None, foreign_key="organizations.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    organization: Optional["Organization"] = Relationship(back_populates="users")
    agent_status: Optional["AgentStatus"] = Relationship(back_populates="user")
    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="user")
    notifications: list["Notification"] = Relationship(back_populates="user")
    sip_credentials: Optional["AgentSipCredentials"] = Relationship(back_populates="user")


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    organization_id: Optional[str] = Field(default=None, foreign_key="organizations.id", index=True)
    token_hash: str = Field(index=True)
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    replaced_by_token_hash: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="refresh_tokens")


class AgentStatus(SQLModel, table=True):
    __tablename__ = "agent_statuses"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    user_id: str = Field(foreign_key="users.id", unique=True, index=True)
    status: str = Field(default="OFFLINE", index=True)
    active_conversations: int = 0
    last_seen_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="agent_status")


class AgentSipCredentials(SQLModel, table=True):
    __tablename__ = "agent_sip_credentials"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    user_id: str = Field(foreign_key="users.id", unique=True, index=True)
    sip_username: str
    sip_password: str
    sub_account: str = Field(index=True)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="sip_credentials")
