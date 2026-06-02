from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SipCredentialsOut(BaseModel):
    username: str
    password: str
    displayName: str
    server: str


class CallbackCreate(BaseModel):
    name: str
    phone: str
    preferred_time: Optional[datetime] = None
    language: str = Field(default="EN", pattern="^(EN|FR)$")
    reason: Optional[str] = None


class RetryTranscriptionIn(BaseModel):
    force: bool = False
