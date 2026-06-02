from models import TranscriptionStatus
from tasks.embeddings import chunks


def test_skip_short_call_status_exists() -> None:
    assert TranscriptionStatus.SKIPPED.value == "SKIPPED"


def test_embedding_chunks_have_expected_size() -> None:
    parts = chunks("a" * 4000, max_chars=1000)
    assert len(parts) == 4
    assert all(len(part) <= 1000 for part in parts)
