from dataclasses import dataclass, field
from datetime import datetime
from math import sqrt
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import AISettings, ArticleStatus, Conversation, Embedding, KnowledgeBaseArticle, Language, Message, SenderType


CONNECTOR_PATTERN = re.compile(r"\b(?:and|then|also|plus|as well as|et|puis|aussi)\b|[?;]", re.IGNORECASE)
WHITESPACE_PATTERN = re.compile(r"\s+")

DEFAULT_RETRIEVAL_TOP_K = 5
DEFAULT_MAX_SUBQUERIES = 4
DEFAULT_CONTEXT_WINDOW_TOKENS = 8192
DEFAULT_RESPONSE_TOKEN_BUDGET = 600
DEFAULT_PROMPT_OVERHEAD_TOKENS = 900
DEFAULT_MAX_CONTEXT_TOKENS = 1800
DEFAULT_MIN_RELEVANCE_SCORE = 0.05


@dataclass
class AIChatResult:
    answer: str
    confidence: float
    should_handoff: bool
    language: str
    source_article_ids: list[str]
    retrieval_status: str = "ANSWERED"
    retrieval_reason: str | None = None
    handoff_reason: str | None = None
    decomposed_queries: list[str] = field(default_factory=list)
    context_token_count: int = 0
    retrieved_contexts: list[dict] = field(default_factory=list)
    retrieval_warnings: list[str] = field(default_factory=list)


@dataclass
class RetrievalSettings:
    confidence_threshold: float
    retrieval_top_k: int
    max_response_tokens: int
    context_window_tokens: int
    max_context_tokens: int


@dataclass
class RetrievalCandidate:
    article: KnowledgeBaseArticle
    score: float
    query: str
    text: str
    chunk_index: int | None = None
    matched_queries: list[str] = field(default_factory=list)


def detect_language(messages: list[str]) -> Language:
    joined = " ".join(messages).lower()
    french_signals = ["bonjour", "merci", "problème", "facture", "mot de passe", "soutien", "j'ai", "connexion"]
    return Language.FR if sum(signal in joined for signal in french_signals) >= 1 else Language.EN


def _tokens(text: str) -> set[str]:
    return {part.strip(".,!?;:()[]{}\"'").lower() for part in text.split() if len(part.strip()) > 2}


def _clean_text(text: str) -> str:
    return WHITESPACE_PATTERN.sub(" ", text).strip()


def lexical_confidence_text(query: str, text: str) -> float:
    q = _tokens(query)
    a = _tokens(text)
    if not q or not a:
        return 0.0
    overlap = len(q & a)
    return min(1.0, overlap / sqrt(len(q) * len(a)) * 2.2)


def lexical_confidence(query: str, article: KnowledgeBaseArticle) -> float:
    return lexical_confidence_text(query, f"{article.title} {article.content} {article.tags}")


def decompose_query(query: str, max_parts: int = DEFAULT_MAX_SUBQUERIES) -> list[str]:
    """Split multi-intent support questions without relying on an LLM call."""
    original = _clean_text(query)
    if not original:
        return []

    parts = [original]
    for part in CONNECTOR_PATTERN.split(original):
        cleaned = _clean_text(part.strip(" .?!;,:"))
        if cleaned and cleaned.lower() not in {item.lower() for item in parts}:
            parts.append(cleaned)
        if len(parts) >= max_parts:
            break
    return parts


def estimate_tokens(text: str) -> int:
    cleaned = _clean_text(text)
    if not cleaned:
        return 0
    return max(1, round(len(cleaned) / 4))


def _trim_to_token_budget(text: str, token_budget: int) -> str:
    if token_budget <= 0:
        return ""
    char_budget = max(0, token_budget * 4 - 3)
    if len(text) <= char_budget:
        return text
    trimmed = text[:char_budget].rsplit(" ", 1)[0].strip()
    return f"{trimmed}..." if trimmed else ""


def _context_budget(retrieval_settings: RetrievalSettings) -> int:
    available = retrieval_settings.context_window_tokens - retrieval_settings.max_response_tokens - DEFAULT_PROMPT_OVERHEAD_TOKENS
    return max(0, min(retrieval_settings.max_context_tokens, available))


def _content_chunks(text: str, max_chars: int = 1600) -> list[str]:
    cleaned = _clean_text(text)
    if len(cleaned) <= max_chars:
        return [cleaned] if cleaned else []
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + max_chars)
        if end < len(cleaned):
            split_at = cleaned.rfind(" ", start, end)
            if split_at > start + max_chars // 2:
                end = split_at
        chunks.append(cleaned[start:end].strip())
        start = end
    return [chunk for chunk in chunks if chunk]


def _candidate_key(candidate: RetrievalCandidate) -> tuple[str, int | str]:
    return candidate.article.id, candidate.chunk_index if candidate.chunk_index is not None else hash(candidate.text)


def build_context_window(candidates: list[RetrievalCandidate], token_budget: int) -> tuple[list[dict], int]:
    if token_budget <= 0:
        return [], 0

    packed: list[dict] = []
    used_tokens = 0
    seen: set[tuple[str, int | str]] = set()
    for candidate in sorted(candidates, key=lambda item: item.score, reverse=True):
        key = _candidate_key(candidate)
        if key in seen:
            continue
        seen.add(key)
        remaining = token_budget - used_tokens
        if remaining <= 0:
            break

        text = _trim_to_token_budget(candidate.text, remaining)
        token_count = estimate_tokens(text)
        if not text or token_count <= 0:
            continue

        article = candidate.article
        packed.append(
            {
                "article_id": article.id,
                "title": article.title,
                "score": round(candidate.score, 3),
                "query": candidate.query,
                "matched_queries": candidate.matched_queries or [candidate.query],
                "chunk_index": candidate.chunk_index,
                "token_count": token_count,
                "text": text,
                "source_type": getattr(article, "source_type", "manual"),
                "source_name": getattr(article, "source_name", None),
                "source_uri": getattr(article, "source_uri", None),
            }
        )
        used_tokens += token_count
    return packed, used_tokens


async def _retrieval_settings(db: AsyncSession, org_id: str) -> RetrievalSettings:
    ai_settings = (await db.execute(select(AISettings).where(AISettings.organization_id == org_id))).scalar_one_or_none()
    return RetrievalSettings(
        confidence_threshold=ai_settings.confidence_threshold if ai_settings else settings.AI_CONFIDENCE_THRESHOLD,
        retrieval_top_k=getattr(ai_settings, "retrieval_top_k", settings.RAG_RETRIEVAL_TOP_K),
        max_response_tokens=getattr(ai_settings, "max_response_tokens", settings.RAG_RESPONSE_TOKEN_BUDGET),
        context_window_tokens=getattr(ai_settings, "context_window_tokens", settings.RAG_CONTEXT_WINDOW_TOKENS),
        max_context_tokens=getattr(ai_settings, "max_context_tokens", settings.RAG_MAX_CONTEXT_TOKENS),
    )


def handoff_message(language: Language) -> str:
    if language == Language.FR:
        return "Je veux m'assurer que vous obtenez la bonne réponse. Je vais créer une demande de soutien pour révision."
    return "I want to make sure you get the right answer. I will create a support request for review."


def no_results_message(language: Language) -> str:
    if language == Language.FR:
        return "Je n'ai trouvé aucun résultat approuvé correspondant à votre question. Je vais créer une demande de soutien pour révision."
    return "I could not find any approved knowledge base results that match your question. I will create a support request for review."


def _normalize_language(language: Language | str) -> Language:
    return language if isinstance(language, Language) else Language(language)


async def _approved_articles(db: AsyncSession, org_id: str) -> list[KnowledgeBaseArticle]:
    rows = (
        await db.execute(
            select(KnowledgeBaseArticle).where(
                KnowledgeBaseArticle.organization_id == org_id,
                KnowledgeBaseArticle.status == ArticleStatus.APPROVED,
            )
        )
    ).scalars().all()
    return list(rows)


async def _embedding_chunks_by_article(db: AsyncSession, org_id: str, article_ids: list[str]) -> dict[str, list[Embedding]]:
    if not article_ids:
        return {}
    rows = (
        await db.execute(
            select(Embedding)
            .where(Embedding.organization_id == org_id, Embedding.article_id.in_(article_ids))
            .order_by(Embedding.article_id, Embedding.chunk_index)
        )
    ).scalars().all()
    grouped: dict[str, list[Embedding]] = {}
    for row in rows:
        grouped.setdefault(row.article_id, []).append(row)
    return grouped


def _retrieve_for_query(
    query: str,
    articles: list[KnowledgeBaseArticle],
    chunks_by_article: dict[str, list[Embedding]],
    limit: int,
    min_score: float = DEFAULT_MIN_RELEVANCE_SCORE,
) -> list[RetrievalCandidate]:
    candidates: list[RetrievalCandidate] = []
    for article in articles:
        chunks = chunks_by_article.get(article.id)
        if chunks:
            for chunk in chunks:
                evidence = _clean_text(chunk.text)
                score = lexical_confidence_text(query, f"{article.title} {article.tags} {evidence}")
                if score >= min_score:
                    candidates.append(RetrievalCandidate(article=article, score=score, query=query, text=evidence, chunk_index=chunk.chunk_index))
        else:
            for idx, evidence in enumerate(_content_chunks(article.content or article.excerpt or "")):
                score = lexical_confidence_text(query, f"{article.title} {article.tags} {evidence}")
                if score >= min_score:
                    candidates.append(RetrievalCandidate(article=article, score=score, query=query, text=evidence, chunk_index=idx))
    return sorted(candidates, key=lambda item: item.score, reverse=True)[:limit]


def _fuse_candidates(query_candidates: list[RetrievalCandidate]) -> list[RetrievalCandidate]:
    fused: dict[tuple[str, int | str], RetrievalCandidate] = {}
    for candidate in query_candidates:
        key = _candidate_key(candidate)
        existing = fused.get(key)
        if not existing:
            candidate.matched_queries = [candidate.query]
            fused[key] = candidate
            continue
        existing.score = min(1.0, max(existing.score, candidate.score) + 0.04)
        if candidate.query not in existing.matched_queries:
            existing.matched_queries.append(candidate.query)
    return sorted(fused.values(), key=lambda item: item.score, reverse=True)


def _unique_article_ids(contexts: list[dict]) -> list[str]:
    ids: list[str] = []
    for context in contexts:
        article_id = context["article_id"]
        if article_id not in ids:
            ids.append(article_id)
    return ids


def _answer_from_contexts(language: Language, contexts: list[dict]) -> str:
    if language == Language.FR:
        prefix = "Voici ce que je peux confirmer d'après les sources approuvées:"
        source_label = "Source"
    else:
        prefix = "Here is what I can confirm from the approved knowledge base:"
        source_label = "Source"

    bullets = []
    for context in contexts[:4]:
        snippet = _trim_to_token_budget(context["text"], 90)
        source = context["title"]
        if context.get("source_name"):
            source = f"{source} ({context['source_name']})"
        bullets.append(f"- {snippet} {source_label}: {source}.")
    return "\n".join([prefix, *bullets])


async def chat(db: AsyncSession, org_id: str, message: str, conversation: Conversation | None = None) -> AIChatResult:
    language = _normalize_language(conversation.language if conversation else detect_language([message]))
    retrieval_settings = await _retrieval_settings(db, org_id)
    queries = decompose_query(message, settings.RAG_MAX_SUBQUERIES)
    articles = await _approved_articles(db, org_id)
    if not articles:
        return AIChatResult(
            no_results_message(language),
            0.0,
            True,
            language.value,
            [],
            retrieval_status="NO_RESULTS",
            retrieval_reason="No approved knowledge base articles are available.",
            handoff_reason="NO_RESULTS",
            decomposed_queries=queries,
        )

    chunks_by_article = await _embedding_chunks_by_article(db, org_id, [article.id for article in articles])
    missing_indexed_articles = len(articles) - len(chunks_by_article)
    if missing_indexed_articles == len(articles):
        warnings = ["embedding_index_empty_fallback_to_articles"]
    elif missing_indexed_articles > 0:
        warnings = ["embedding_index_partial_fallback_to_articles"]
    else:
        warnings = []
    query_candidates = [
        candidate
        for query in queries
        for candidate in _retrieve_for_query(query, articles, chunks_by_article, retrieval_settings.retrieval_top_k)
    ]
    candidates = _fuse_candidates(query_candidates)
    context_budget = _context_budget(retrieval_settings)
    contexts, context_token_count = build_context_window(candidates, context_budget)
    if not contexts:
        return AIChatResult(
            no_results_message(language),
            0.0,
            True,
            language.value,
            [],
            retrieval_status="NO_RESULTS",
            retrieval_reason="No approved source matched the decomposed query set.",
            handoff_reason="NO_RESULTS",
            decomposed_queries=queries,
            retrieval_warnings=warnings,
        )

    confidence = min(1.0, max(context["score"] for context in contexts) + (0.03 * max(0, len(_unique_article_ids(contexts)) - 1)))
    source_article_ids = _unique_article_ids(contexts)
    if confidence < retrieval_settings.confidence_threshold:
        return AIChatResult(
            handoff_message(language),
            round(confidence, 3),
            True,
            language.value,
            source_article_ids,
            retrieval_status="LOW_CONFIDENCE",
            retrieval_reason=f"Best retrieved context scored below threshold {retrieval_settings.confidence_threshold:.2f}.",
            handoff_reason="LOW_CONFIDENCE",
            decomposed_queries=queries,
            context_token_count=context_token_count,
            retrieved_contexts=contexts,
            retrieval_warnings=warnings,
        )

    return AIChatResult(
        _answer_from_contexts(language, contexts),
        round(confidence, 3),
        False,
        language.value,
        source_article_ids,
        retrieval_status="ANSWERED",
        decomposed_queries=queries,
        context_token_count=context_token_count,
        retrieved_contexts=contexts,
        retrieval_warnings=warnings,
    )


async def suggest_reply(db: AsyncSession, org_id: str, prompt: str) -> dict:
    result = await chat(db, org_id, prompt)
    return {
        "suggestion": result.answer[:800],
        "confidence": result.confidence,
        "source_article_ids": result.source_article_ids,
        "retrieval_status": result.retrieval_status,
        "retrieval_reason": result.retrieval_reason,
    }


async def summarize_conversation(db: AsyncSession, conversation_id: str, org_id: str) -> str:
    messages = (
        await db.execute(
            select(Message)
            .where(Message.organization_id == org_id, Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
    ).scalars().all()
    visible = [m.content for m in messages if not m.is_internal][-8:]
    if not visible:
        summary = "No customer-visible messages yet."
    else:
        summary = "Issue: " + visible[0][:180] + " Actions: Support reviewed the conversation. Outcome: Follow-up may be required."
    conversation = await db.get(Conversation, conversation_id)
    if conversation and conversation.organization_id == org_id:
        conversation.ai_summary = summary
        conversation.updated_at = datetime.utcnow()
    return summary


async def index_article(db: AsyncSession, article_id: str, org_id: str) -> dict:
    article = await db.get(KnowledgeBaseArticle, article_id)
    if article and article.organization_id == org_id:
        article.embedding_status = "PROCESSING"
        article.updated_at = datetime.utcnow()
    return {"queued": True, "article_id": article_id}
