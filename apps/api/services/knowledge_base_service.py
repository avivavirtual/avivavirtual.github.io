from datetime import datetime
import re

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ArticleStatus, Embedding, EmbeddingStatus, KnowledgeBaseArticle, KnowledgeBaseFile, User
from schemas import ArticleCreate, ArticlePatch
from services.ai_service import lexical_confidence


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "article"


async def list_articles(db: AsyncSession, org_id: str) -> list[KnowledgeBaseArticle]:
    rows = (
        await db.execute(
            select(KnowledgeBaseArticle).where(KnowledgeBaseArticle.organization_id == org_id).order_by(KnowledgeBaseArticle.updated_at.desc()).limit(100)
        )
    ).scalars().all()
    return list(rows)


async def get_article(db: AsyncSession, article_id: str, org_id: str) -> KnowledgeBaseArticle:
    article = await db.get(KnowledgeBaseArticle, article_id)
    if not article or article.organization_id != org_id:
        raise HTTPException(404, "Article not found")
    return article


async def create_article(db: AsyncSession, payload: ArticleCreate, user: User) -> KnowledgeBaseArticle:
    article = KnowledgeBaseArticle(
        organization_id=user.organization_id or "",
        title=payload.title,
        slug=slugify(payload.title),
        content=payload.content,
        excerpt=payload.content[:240],
        tags=payload.tags,
        language=payload.language,
        created_by_id=user.id,
    )
    db.add(article)
    return article


async def patch_article(db: AsyncSession, article_id: str, payload: ArticlePatch, user: User) -> KnowledgeBaseArticle:
    article = await get_article(db, article_id, user.organization_id or "")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(article, key, value)
    if payload.title:
        article.slug = slugify(payload.title)
    article.updated_at = datetime.utcnow()
    return article


async def delete_article(db: AsyncSession, article_id: str, org_id: str) -> dict:
    article = await get_article(db, article_id, org_id)
    await db.execute(delete(Embedding).where(Embedding.article_id == article.id))
    await db.delete(article)
    return {"ok": True}


async def publish_article(db: AsyncSession, article_id: str, user: User) -> KnowledgeBaseArticle:
    article = await get_article(db, article_id, user.organization_id or "")
    article.status = ArticleStatus.APPROVED
    article.published_at = datetime.utcnow()
    article.embedding_status = EmbeddingStatus.PENDING
    article.updated_at = datetime.utcnow()
    return article


async def upload_article(db: AsyncSession, file: UploadFile, user: User) -> KnowledgeBaseArticle:
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1", errors="ignore")
    title = (file.filename or "Uploaded article").rsplit(".", 1)[0]
    article = KnowledgeBaseArticle(
        organization_id=user.organization_id or "",
        title=title,
        slug=slugify(title),
        content=text,
        excerpt=text[:240],
        created_by_id=user.id,
    )
    db.add(article)
    await db.flush()
    db.add(
        KnowledgeBaseFile(
            organization_id=user.organization_id or "",
            article_id=article.id,
            file_name=file.filename or "upload",
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=len(raw),
            storage_url=f"local://kb/{article.id}/{file.filename or 'upload'}",
            extracted_text=text,
        )
    )
    return article


async def semantic_search(db: AsyncSession, org_id: str, query: str, limit: int = 5) -> list[dict]:
    rows = (
        await db.execute(
            select(KnowledgeBaseArticle).where(
                KnowledgeBaseArticle.organization_id == org_id,
                KnowledgeBaseArticle.status == ArticleStatus.APPROVED,
            )
        )
    ).scalars().all()
    ranked = sorted(((lexical_confidence(query, article), article) for article in rows), key=lambda x: x[0], reverse=True)[:limit]
    return [{"article": article, "score": round(score, 3)} for score, article in ranked]
