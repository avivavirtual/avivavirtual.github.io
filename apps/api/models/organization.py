from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel


class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    domain: Optional[str] = None
    billing_email: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "America/Toronto"
    is_active: bool = True
    subscription_plan_id: Optional[str] = Field(default=None, foreign_key="subscription_plans.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    users: list["User"] = Relationship(back_populates="organization")
    client_settings: Optional["ClientSettings"] = Relationship(back_populates="organization")
    chat_widget: Optional["ChatWidget"] = Relationship(back_populates="organization")
    ai_settings: Optional["AISettings"] = Relationship(back_populates="organization")
    sla_config: Optional["SLAConfig"] = Relationship(back_populates="organization")


class ClientSettings(SQLModel, table=True):
    __tablename__ = "client_settings"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", unique=True, index=True)
    business_hours: str = "Mon-Fri 09:00-17:00 America/Toronto"
    support_email: str = "support@avivavirtual.ca"
    default_language: str = "EN"
    allow_file_uploads: bool = True
    require_widget_consent: bool = True
    data_residency_region: str = "CA"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    organization: Optional[Organization] = Relationship(back_populates="client_settings")


class ChatWidget(SQLModel, table=True):
    __tablename__ = "chat_widgets"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", unique=True, index=True)
    title: str = "Avivavirtual Support"
    primary_color: str = "#0EA5E9"
    welcome_message_en: str = "Hi, how can we help?"
    welcome_message_fr: str = "Bonjour, comment pouvons-nous vous aider?"
    consent_text_en: str = "I consent to Avivavirtual processing this conversation to provide support."
    consent_text_fr: str = "Je consens au traitement de cette conversation afin de recevoir du soutien."
    allowed_domains: str = "*"
    is_enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    organization: Optional[Organization] = Relationship(back_populates="chat_widget")


class SLAConfig(SQLModel, table=True):
    __tablename__ = "sla_configs"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", unique=True, index=True)
    urgent_response_minutes: int = 60
    high_response_minutes: int = 240
    medium_response_minutes: int = 480
    low_response_minutes: int = 1440
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    organization: Optional[Organization] = Relationship(back_populates="sla_config")
