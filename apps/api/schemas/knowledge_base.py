from typing import Optional

from pydantic import BaseModel, Field

from models import ArticleStatus


class ArticleCreate(BaseModel):
    title: str
    content: str
    tags: str = ""
    language: str = Field(default="EN", pattern="^(EN|FR)$")


class ArticlePatch(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    language: Optional[str] = Field(default=None, pattern="^(EN|FR)$")
    status: Optional[ArticleStatus] = None


class SearchQuery(BaseModel):
    q: str
    limit: int = Field(default=5, ge=1, le=20)
