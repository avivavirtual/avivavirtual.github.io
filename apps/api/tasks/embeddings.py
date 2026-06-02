import asyncio

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
    if not settings.OPENAI_API_KEY:
        return [[0.0] * 1536 for _ in parts]
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.embeddings.create(model=settings.OPENAI_EMBEDDING_MODEL, input=parts)
    return [item.embedding for item in response.data]


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
