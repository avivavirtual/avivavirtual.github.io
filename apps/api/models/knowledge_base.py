from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel

try:
    from pgvector.sqlalchemy import Vector
except ImportError:  # Allows local import before Python deps are installed.
    Vector = None  # type: ignore[assignment]


class ArticleStatus(str, Enum):
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    ARCHIVED = "ARCHIVED"


class EmbeddingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class KnowledgeBaseArticle(SQLModel, table=True):
    __tablename__ = "knowledge_base_articles"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    title: str
    slug: str = Field(index=True)
    content: str
    excerpt: Optional[str] = None
    tags: str = ""
    language: str = "EN"
    status: ArticleStatus = ArticleStatus.DRAFT
    embedding_status: EmbeddingStatus = EmbeddingStatus.PENDING
    published_at: Optional[datetime] = None
    created_by_id: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    files: list["KnowledgeBaseFile"] = Relationship(back_populates="article")
    embeddings: list["Embedding"] = Relationship(back_populates="article")


class KnowledgeBaseFile(SQLModel, table=True):
    __tablename__ = "knowledge_base_files"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    article_id: Optional[str] = Field(default=None, foreign_key="knowledge_base_articles.id", index=True)
    file_name: str
    mime_type: str
    size_bytes: int
    storage_url: str
    extracted_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    article: Optional[KnowledgeBaseArticle] = Relationship(back_populates="files")


class Embedding(SQLModel, table=True):
    __tablename__ = "embeddings"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    organization_id: str = Field(foreign_key="organizations.id", index=True)
    article_id: str = Field(foreign_key="knowledge_base_articles.id", index=True)
    chunk_index: int
    text: str
    embedding: list[float] = Field(
        default_factory=list,
        sa_column=Column(Vector(1536) if Vector else JSON),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    article: Optional[KnowledgeBaseArticle] = Relationship(back_populates="embeddings")
