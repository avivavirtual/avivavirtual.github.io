from models import ArticleStatus, KnowledgeBaseArticle, Language
from services.ai_service import (
    RetrievalCandidate,
    build_context_window,
    decompose_query,
    detect_language,
    handoff_message,
    lexical_confidence,
    no_results_message,
)


def test_chat_returns_handoff_message_in_english() -> None:
    assert "support request for review" in handoff_message(Language.EN)


def test_language_detection_french() -> None:
    assert detect_language(["Bonjour, j'ai un probleme de facture"]) == Language.FR


def test_approved_article_similarity_scores_relevant_text() -> None:
    article = KnowledgeBaseArticle(
        organization_id="org-1",
        title="Password reset",
        slug="password-reset",
        content="Users can reset passwords from the login screen using a time-limited link.",
        status=ArticleStatus.APPROVED,
    )
    assert lexical_confidence("How do I reset my password?", article) > 0


def test_query_decomposition_keeps_original_and_subqueries() -> None:
    queries = decompose_query("How do I reset my password and update billing?")
    assert queries[0] == "How do I reset my password and update billing?"
    assert "How do I reset my password" in queries
    assert "update billing" in queries


def test_context_window_respects_token_budget() -> None:
    article = KnowledgeBaseArticle(
        id="article-1",
        organization_id="org-1",
        title="Billing",
        slug="billing",
        content="Billing details",
        status=ArticleStatus.APPROVED,
        source_type="kaggle",
        source_name="support.csv",
    )
    candidates = [
        RetrievalCandidate(article=article, score=0.9, query="billing", text="word " * 200, chunk_index=0),
        RetrievalCandidate(article=article, score=0.8, query="billing", text="second chunk", chunk_index=1),
    ]
    contexts, used_tokens = build_context_window(candidates, token_budget=25)
    assert used_tokens <= 25
    assert contexts[0]["source_type"] == "kaggle"
    assert contexts[0]["source_name"] == "support.csv"


def test_no_results_message_is_explicit() -> None:
    assert "could not find any approved knowledge base results" in no_results_message(Language.EN).lower()
