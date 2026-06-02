from typing import Optional

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str
    slug: str = Field(pattern="^[a-z0-9-]+$")
    domain: Optional[str] = None
    billing_email: Optional[str] = None
    phone: Optional[str] = None


class OrganizationPatch(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    billing_email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class ClientSettingsPatch(BaseModel):
    business_hours: Optional[str] = None
    support_email: Optional[str] = None
    default_language: Optional[str] = Field(default=None, pattern="^(EN|FR)$")
    allow_file_uploads: Optional[bool] = None
    require_widget_consent: Optional[bool] = None


class WidgetConfigPatch(BaseModel):
    title: Optional[str] = None
    primary_color: Optional[str] = None
    welcome_message_en: Optional[str] = None
    welcome_message_fr: Optional[str] = None
    allowed_domains: Optional[str] = None
    is_enabled: Optional[bool] = None
