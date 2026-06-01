import hmac
import os
from fastapi import Header, HTTPException

DEFAULT_SECRET = "change-me-shared-secret"


def require_configured_secret() -> str:
    expected = os.getenv("WHISPER_API_SECRET")
    if not expected or expected == DEFAULT_SECRET:
        raise RuntimeError("WHISPER_API_SECRET must be set to a non-default secret")
    return expected


def verify_api_key(x_api_key: str = Header(default="")) -> None:
    expected = require_configured_secret()
    if not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid API key")
