from typing import Optional

from pydantic import BaseModel, Field

from models import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    subject: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    customer_id: Optional[str] = None
    conversation_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None


class TicketPatch(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    assigned_agent_id: Optional[str] = None


class TicketStatusPatch(BaseModel):
    status: TicketStatus


class TicketAssign(BaseModel):
    agent_id: str


class TicketCommentCreate(BaseModel):
    body: str
    is_internal: bool = False


class TicketFilters(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    agent_id: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)
