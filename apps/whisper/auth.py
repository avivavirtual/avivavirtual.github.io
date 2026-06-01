import hmac
import os
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(default="")) -> None:
    expected = os.getenv("WHISPER_API_SECRET", "change-me-shared-secret")
    if not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid API key")
