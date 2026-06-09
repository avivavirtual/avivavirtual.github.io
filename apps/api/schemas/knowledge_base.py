from typing import Optional

from pydantic import BaseModel, Field

from models import ArticleStatus


class ArticleCreate(BaseModel):
    title: str
    content: str
    tags: str = ""
    language: str = Field(default="EN", pattern="^(EN|FR)$")
    source_type: str = "manual"
    source_name: Optional[str] = None
    source_uri: Optional[str] = None
    source_metadata: dict = Field(default_factory=dict)


class ArticlePatch(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    language: Optional[str] = Field(default=None, pattern="^(EN|FR)$")
    status: Optional[ArticleStatus] = None
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    source_uri: Optional[str] = None
    source_metadata: Optional[dict] = None


class SearchQuery(BaseModel):
    q: str
    limit: int = Field(default=5, ge=1, le=20)
