from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel


class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    ticket_number: str = Field(index=True)
    customer_id: Optional[str] = Field(default=None, foreign_key="customers.id", index=True)
    conversation_id: Optional[str] = Field(default=None, foreign_key="conversations.id", index=True)
    assigned_agent_id: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    subject: str
    description: str
    status: TicketStatus = TicketStatus.OPEN
    priority: TicketPriority = TicketPriority.MEDIUM
    due_at: Optional[datetime] = Field(default=None, index=True)
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    sla_breached: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    comments: list["TicketComment"] = Relationship(back_populates="ticket")
    attachments: list["TicketAttachment"] = Relationship(back_populates="ticket")


class TicketComment(SQLModel, table=True):
    __tablename__ = "ticket_comments"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    ticket_id: str = Field(foreign_key="tickets.id", index=True)
    author_id: Optional[str] = Field(default=None, foreign_key="users.id")
    body: str
    is_internal: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    ticket: Optional[Ticket] = Relationship(back_populates="comments")


class TicketAttachment(SQLModel, table=True):
    __tablename__ = "ticket_attachments"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    ticket_id: str = Field(foreign_key="tickets.id", index=True)
    uploaded_by_id: Optional[str] = Field(default=None, foreign_key="users.id")
    file_name: str
    mime_type: str
    size_bytes: int
    storage_url: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    ticket: Optional[Ticket] = Relationship(back_populates="attachments")
