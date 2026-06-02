from base64 import b64decode, b64encode
import hashlib
import secrets
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import httpx

from config import settings

BASE_URL = "https://voip.ms/api/v1/rest.php"


def _key() -> bytes:
    raw = settings.ENCRYPTION_KEY.encode("utf-8")
    return hashlib.sha256(raw).digest()


def encrypt_secret(value: str) -> str:
    aes = AESGCM(_key())
    nonce = secrets.token_bytes(12)
    ciphertext = aes.encrypt(nonce, value.encode("utf-8"), None)
    return b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_secret(value: str) -> str:
    data = b64decode(value.encode("utf-8"))
    return AESGCM(_key()).decrypt(data[:12], data[12:], None).decode("utf-8")


async def _call(method: str, **params: Any) -> dict[str, Any]:
    if not settings.VOIPMS_API_USERNAME or not settings.VOIPMS_API_PASSWORD:
        return {"status": "dev", "method": method, "params": params}
    query = {
        "api_username": settings.VOIPMS_API_USERNAME,
        "api_password": settings.VOIPMS_API_PASSWORD,
        "method": method,
        **params,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(BASE_URL, params=query)
        response.raise_for_status()
        return response.json()


async def get_dids_info(did: str) -> dict[str, Any]:
    return await _call("getDIDsInfo", did=did)


async def set_did_info(did: str, **kwargs: Any) -> dict[str, Any]:
    return await _call("setDIDInfo", did=did, **kwargs)


async def get_cdr(date_from: str, date_to: str) -> list[dict[str, Any]]:
    data = await _call("getCDR", date_from=date_from, date_to=date_to)
    return data.get("cdr", []) if isinstance(data, dict) else []


async def get_sub_accounts() -> dict[str, Any]:
    return await _call("getSubAccounts")


async def create_sub_account(username: str, password: str, description: str, callerid: str) -> str:
    account = f"{settings.VOIPMS_ACCOUNT}_{username}" if settings.VOIPMS_ACCOUNT else username
    await _call(
        "createSubAccount",
        username=username,
        password=password,
        description=description,
        callerid_number=callerid or settings.VOIPMS_DID,
        protocol=1,
        voicemail=1,
    )
    return account


async def del_sub_account(account: str) -> dict[str, Any]:
    return await _call("delSubAccount", account=account)


async def get_sms(did: str, date_from: str, date_to: str) -> dict[str, Any]:
    return await _call("getSMS", did=did, date_from=date_from, date_to=date_to)


async def send_sms(did: str, dst: str, message: str) -> dict[str, Any]:
    return await _call("sendSMS", did=did, dst=dst, message=message)
