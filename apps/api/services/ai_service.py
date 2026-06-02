from dataclasses import dataclass
from datetime import datetime
from math import sqrt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import AISettings, ArticleStatus, Conversation, KnowledgeBaseArticle, Language, Message, SenderType


@dataclass
class AIChatResult:
    answer: str
    confidence: float
    should_handoff: bool
    language: str
    source_article_ids: list[str]


def detect_language(messages: list[str]) -> Language:
    joined = " ".join(messages).lower()
    french_signals = ["bonjour", "merci", "problème", "facture", "mot de passe", "soutien", "j'ai", "connexion"]
    return Language.FR if sum(signal in joined for signal in french_signals) >= 1 else Language.EN


def _tokens(text: str) -> set[str]:
    return {part.strip(".,!?;:()[]{}\"'").lower() for part in text.split() if len(part.strip()) > 2}


def lexical_confidence(query: str, article: KnowledgeBaseArticle) -> float:
    q = _tokens(query)
    a = _tokens(f"{article.title} {article.content} {article.tags}")
    if not q or not a:
        return 0.0
    overlap = len(q & a)
    return min(1.0, overlap / sqrt(len(q) * len(a)) * 2.2)


async def _threshold(db: AsyncSession, org_id: str) -> float:
    ai_settings = (await db.execute(select(AISettings).where(AISettings.organization_id == org_id))).scalar_one_or_none()
    return ai_settings.confidence_threshold if ai_settings else settings.AI_CONFIDENCE_THRESHOLD


def handoff_message(language: Language) -> str:
    if language == Language.FR:
        return "Je veux m'assurer que vous obtenez la bonne réponse. Je vais créer une demande de soutien pour révision."
    return "I want to make sure you get the right answer. I will create a support request for review."


async def chat(db: AsyncSession, org_id: str, message: str, conversation: Conversation | None = None) -> AIChatResult:
    language = conversation.language if conversation else detect_language([message])
    rows = (
        await db.execute(
            select(KnowledgeBaseArticle).where(
                KnowledgeBaseArticle.organization_id == org_id,
                KnowledgeBaseArticle.status == ArticleStatus.APPROVED,
            )
        )
    ).scalars().all()
    articles = list(rows)
    if not articles:
        return AIChatResult(handoff_message(language), 0.0, True, language.value, [])

    ranked = sorted(((lexical_confidence(message, article), article) for article in articles), key=lambda x: x[0], reverse=True)
    confidence, best = ranked[0]
    threshold = await _threshold(db, org_id)
    if confidence < threshold:
        return AIChatResult(handoff_message(language), round(confidence, 3), True, language.value, [best.id])

    excerpt = best.excerpt or best.content[:700]
    answer_prefix = "Voici ce que je peux confirmer d'après notre base approuvée:" if language == Language.FR else "Here is what I can confirm from our approved knowledge base:"
    answer = f"{answer_prefix} {excerpt}"
    return AIChatResult(answer, round(confidence, 3), False, language.value, [best.id])


async def suggest_reply(db: AsyncSession, org_id: str, prompt: str) -> dict:
    result = await chat(db, org_id, prompt)
    return {
        "suggestion": result.answer[:800],
        "confidence": result.confidence,
        "source_article_ids": result.source_article_ids,
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
