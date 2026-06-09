import asyncio

import httpx
from sqlalchemy import delete

from celery_app import celery
from config import settings
from database import AsyncSessionLocal
from models import Embedding, EmbeddingStatus, KnowledgeBaseArticle


def chunks(text: str, max_chars: int = 1800) -> list[str]:
    return [text[i : i + max_chars] for i in range(0, len(text), max_chars)] or [text]


@celery.task(name="tasks.embeddings.index_article", bind=True, max_retries=3)
def index_article(self, article_id: str) -> dict:
    try:
        return asyncio.run(_index_article(article_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1)) from exc


async def _embed_text(parts: list[str]) -> list[list[float]]:
    if not settings.GEMINI_API_KEY:
        return [[0.0] * settings.GEMINI_EMBEDDING_DIMENSIONS for _ in parts]

    model = settings.GEMINI_EMBEDDING_MODEL.removeprefix("models/")
    payload = {
        "requests": [
            {
                "model": f"models/{model}",
                "content": {"parts": [{"text": part}]},
                "embedContentConfig": {"outputDimensionality": settings.GEMINI_EMBEDDING_DIMENSIONS},
            }
            for part in parts
        ]
    }
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents",
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
            json=payload,
        )
        response.raise_for_status()
    data = response.json()
    embeddings = [item.get("values", []) for item in data.get("embeddings", [])]
    if len(embeddings) != len(parts):
        raise ValueError(f"Gemini returned {len(embeddings)} embeddings for {len(parts)} chunks")
    if any(len(vector) != settings.GEMINI_EMBEDDING_DIMENSIONS for vector in embeddings):
        raise ValueError("Gemini embedding dimensions do not match GEMINI_EMBEDDING_DIMENSIONS")
    return embeddings


async def _index_article(article_id: str) -> dict:
    async with AsyncSessionLocal() as db:
        article = await db.get(KnowledgeBaseArticle, article_id)
        if not article:
            return {"ok": False, "reason": "not_found"}
        article.embedding_status = EmbeddingStatus.PROCESSING
        await db.execute(delete(Embedding).where(Embedding.article_id == article.id))
        parts = chunks(f"{article.title}\n\n{article.content}")
        vectors = await _embed_text(parts)
        for idx, (part, vector) in enumerate(zip(parts, vectors)):
            db.add(Embedding(organization_id=article.organization_id, article_id=article.id, chunk_index=idx, text=part, embedding=vector))
        article.embedding_status = EmbeddingStatus.COMPLETED
        await db.commit()
        return {"ok": True, "chunks": len(parts)}
