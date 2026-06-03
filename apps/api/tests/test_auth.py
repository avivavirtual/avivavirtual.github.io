from datetime import datetime, timezone

from jose import jwt

from config import settings
from models import Language, User, UserRole
from services.auth_service import access_token_for, refresh_hash


def test_refresh_hash_is_stable_and_non_plaintext() -> None:
    token = "refresh-token"
    hashed = refresh_hash(token)
    assert hashed == refresh_hash(token)
    assert hashed != token
    assert len(hashed) == 64


def test_access_token_contains_tenant_payload() -> None:
    user = User(
        email="agent@test.ca",
        password_hash="hash",
        first_name="Agent",
        last_name="Test",
        role=UserRole.AGENT,
        language=Language.EN,
        organization_id="org-1",
    )
    encoded = access_token_for(user)
    decoded = jwt.decode(encoded, settings.JWT_SECRET, algorithms=["HS256"])
    assert decoded["sub"] == user.id
    assert decoded["orgId"] == "org-1"
    assert decoded["role"] == "AGENT"
    assert decoded["exp"] > int(datetime.now(timezone.utc).timestamp())
