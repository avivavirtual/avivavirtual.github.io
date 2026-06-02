from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


class TranscriptionStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    DOWNLOADING = "DOWNLOADING"
    TRANSCRIBING = "TRANSCRIBING"
    SUMMARIZING = "SUMMARIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class CallRecord(SQLModel, table=True):
    __tablename__ = "call_records"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    agent_id: Optional[str] = Field(default=None, foreign_key="users.id")
    customer_id: Optional[str] = Field(default=None, foreign_key="customers.id")
    conversation_id: Optional[str] = Field(default=None, foreign_key="conversations.id")
    sip_call_id: Optional[str] = Field(default=None, unique=True)
    direction: str
    from_number: str
    to_number: str
    bill_seconds: Optional[int] = None
    disposition: Optional[str] = None
    cost: Optional[float] = None
    recording_url: Optional[str] = None
    recording_stored_url: Optional[str] = None
    recording_size: Optional[int] = None
    voicemail_url: Optional[str] = None
    transcription: Optional[str] = None
    transcription_lang: Optional[str] = None
    transcription_at: Optional[datetime] = None
    transcription_model: Optional[str] = None
    transcription_cost: Optional[float] = None
    summary: Optional[str] = None
    summary_at: Optional[datetime] = None
    summary_model: Optional[str] = None
    transcription_status: TranscriptionStatus = TranscriptionStatus.PENDING
    transcription_error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CallbackRequest(SQLModel, table=True):
    __tablename__ = "callback_requests"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    customer_id: Optional[str] = Field(default=None, foreign_key="customers.id")
    name: str
    phone: str
    preferred_time: Optional[datetime] = None
    language: str = "EN"
    reason: Optional[str] = None
    status: str = Field(default="OPEN", index=True)
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
