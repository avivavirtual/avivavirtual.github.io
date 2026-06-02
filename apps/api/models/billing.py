from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlmodel import Field, SQLModel


class SubscriptionPlan(SQLModel, table=True):
    __tablename__ = "subscription_plans"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    code: str = Field(unique=True, index=True)
    name: str
    monthly_cad: float = 0.0
    included_agents: int = 1
    included_conversations: int = 100
    features: str = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
