from datetime import datetime
import csv
from io import StringIO
import re

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ArticleStatus, Embedding, EmbeddingStatus, KnowledgeBaseArticle, KnowledgeBaseFile, User
from schemas import ArticleCreate, ArticlePatch
from services.ai_service import DEFAULT_MIN_RELEVANCE_SCORE, decompose_query, lexical_confidence


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "article"


def _safe_source_type(value: str | None, fallback: str = "manual") -> str:
    source_type = re.sub(r"[^a-z0-9_-]+", "_", (value or fallback).lower()).strip("_")
    return source_type or fallback


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
        source_type=_safe_source_type(payload.source_type),
        source_name=payload.source_name,
        source_uri=payload.source_uri,
        source_metadata=payload.source_metadata,
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
        source_type="upload",
        source_name=file.filename,
        source_uri=f"local://kb/upload/{file.filename or 'upload'}",
        source_metadata={"mime_type": file.content_type or "application/octet-stream"},
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
            source_type="upload",
            source_name=file.filename,
            source_uri=f"local://kb/upload/{file.filename or 'upload'}",
            source_metadata={"article_id": article.id},
        )
    )
    return article


def _choose_csv_column(fieldnames: list[str], preferred: str | None, fallbacks: list[str]) -> str | None:
    normalized = {name.lower(): name for name in fieldnames}
    if preferred and preferred.lower() in normalized:
        return normalized[preferred.lower()]
    for fallback in fallbacks:
        if fallback.lower() in normalized:
            return normalized[fallback.lower()]
    return fieldnames[0] if fieldnames else None


async def import_kaggle_csv(
    db: AsyncSession,
    file: UploadFile,
    user: User,
    title_column: str | None = None,
    content_column: str | None = None,
    tags_column: str | None = None,
    limit: int = 50,
) -> dict:
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1", errors="ignore")

    reader = csv.DictReader(StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(400, "CSV must include a header row")

    title_key = _choose_csv_column(reader.fieldnames, title_column, ["title", "question", "name", "subject"])
    content_key = _choose_csv_column(reader.fieldnames, content_column, ["content", "answer", "text", "description", "body"])
    tags_key = _choose_csv_column(reader.fieldnames, tags_column, ["tags", "category", "label"])
    if not content_key:
        raise HTTPException(400, "CSV must include a content-like column")

    created: list[KnowledgeBaseArticle] = []
    filename = file.filename or "kaggle-dataset.csv"
    limit = max(1, min(limit, 500))
    for row_number, row in enumerate(reader, start=2):
        if len(created) >= limit:
            break
        content = _clean_cell(row.get(content_key))
        if not content:
            continue
        title = _clean_cell(row.get(title_key)) if title_key else f"Kaggle row {row_number}"
        if not title:
            title = f"Kaggle row {row_number}"
        tags = _clean_cell(row.get(tags_key)) if tags_key else "kaggle,experiment"
        article = KnowledgeBaseArticle(
            organization_id=user.organization_id or "",
            title=title[:180],
            slug=slugify(f"{filename}-{row_number}-{title}"),
            content=content,
            excerpt=content[:240],
            tags=tags or "kaggle,experiment",
            source_type="kaggle",
            source_name=filename,
            source_uri=f"kaggle://local-experiment/{filename}#row={row_number}",
            source_metadata={"row_number": row_number, "columns": reader.fieldnames},
            created_by_id=user.id,
        )
        db.add(article)
        created.append(article)

    await db.flush()
    return {
        "source_type": "kaggle",
        "source_name": filename,
        "created": len(created),
        "article_ids": [article.id for article in created],
        "title_column": title_key,
        "content_column": content_key,
        "tags_column": tags_key,
    }


def _clean_cell(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


async def semantic_search(db: AsyncSession, org_id: str, query: str, limit: int = 5) -> list[dict]:
    rows = (
        await db.execute(
            select(KnowledgeBaseArticle).where(
                KnowledgeBaseArticle.organization_id == org_id,
                KnowledgeBaseArticle.status == ArticleStatus.APPROVED,
            )
        )
    ).scalars().all()
    results: dict[str, dict] = {}
    for subquery in decompose_query(query):
        ranked = sorted(((lexical_confidence(subquery, article), article) for article in rows), key=lambda x: x[0], reverse=True)[:limit]
        for score, article in ranked:
            if score < DEFAULT_MIN_RELEVANCE_SCORE:
                continue
            existing = results.get(article.id)
            if not existing:
                results[article.id] = {"article": article, "score": score, "matched_queries": [subquery]}
                continue
            existing["score"] = max(existing["score"], score)
            if subquery not in existing["matched_queries"]:
                existing["matched_queries"].append(subquery)
    return [
        {
            "article": result["article"],
            "score": round(result["score"], 3),
            "matched_queries": result["matched_queries"],
            "source_type": getattr(result["article"], "source_type", "manual"),
        }
        for result in sorted(results.values(), key=lambda item: item["score"], reverse=True)[:limit]
    ]
