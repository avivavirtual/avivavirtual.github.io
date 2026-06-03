from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel


class AISettings(SQLModel, table=True):
    __tablename__ = "ai_settings"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", unique=True, index=True)
    confidence_threshold: float = 0.75
    model: str = "gpt-3.5-turbo"
    embedding_model: str = "text-embedding-3-small"
    enabled_languages: str = "EN,FR"
    auto_handoff_enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    organization: Optional["Organization"] = Relationship(back_populates="ai_settings")
