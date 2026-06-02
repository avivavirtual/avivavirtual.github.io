import hmac
import os

from fastapi import Header, HTTPException, status

WHISPER_API_SECRET = os.getenv("WHISPER_API_SECRET", "")


async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> bool:
    if not WHISPER_API_SECRET:
        raise HTTPException(500, "Server misconfigured")
    if not hmac.compare_digest(x_api_key.encode(), WHISPER_API_SECRET.encode()):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid API key")
    return True
