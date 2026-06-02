from models import ArticleStatus, KnowledgeBaseArticle, Language
from services.ai_service import detect_language, handoff_message, lexical_confidence


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
