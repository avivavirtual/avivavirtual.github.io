from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel

from .user import Language


class ConversationStatus(str, Enum):
    OPEN = "OPEN"
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    CLOSED = "CLOSED"


class ConversationChannel(str, Enum):
    WIDGET = "WIDGET"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    MOBILE = "MOBILE"


class SenderType(str, Enum):
    CUSTOMER = "CUSTOMER"
    AGENT = "AGENT"
    AI = "AI"
    SYSTEM = "SYSTEM"


class Customer(SQLModel, table=True):
    __tablename__ = "customers"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    email: Optional[str] = Field(default=None, index=True)
    first_name: str
    last_name: str = ""
    phone: Optional[str] = Field(default=None, index=True)
    language: Language = Language.EN
    consent_given: bool = False
    consent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    conversations: list["Conversation"] = Relationship(back_populates="customer")


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    customer_id: Optional[str] = Field(default=None, foreign_key="customers.id", index=True)
    assigned_agent_id: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    channel: ConversationChannel = ConversationChannel.WIDGET
    status: ConversationStatus = ConversationStatus.PENDING
    subject: Optional[str] = None
    language: Language = Language.EN
    is_handed_off: bool = False
    handoff_reason: Optional[str] = None
    ai_summary: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    closed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    customer: Optional[Customer] = Relationship(back_populates="conversations")
    messages: list["Message"] = Relationship(back_populates="conversation")


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    sender_type: SenderType
    sender_id: Optional[str] = Field(default=None, foreign_key="users.id")
    content: str
    language: Language = Language.EN
    is_internal: bool = False
    confidence: Optional[float] = None
    tokens_used: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    conversation: Optional[Conversation] = Relationship(back_populates="messages")
