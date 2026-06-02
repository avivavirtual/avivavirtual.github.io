from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from models import Language


class WidgetStart(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language: Language = Language.EN
    message: str
    consent: bool


class WidgetMessage(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    message: str


class AgentMessage(BaseModel):
    content: str
    is_internal: bool = False


class AssignConversation(BaseModel):
    agent_id: str


class RateConversation(BaseModel):
    rating: int = Field(ge=1, le=5)


class ConversationFilters(BaseModel):
    status: Optional[str] = None
    agent_id: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)
