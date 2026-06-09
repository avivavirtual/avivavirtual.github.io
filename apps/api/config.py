from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

def _env_file() -> str:
    config_path = Path(__file__).resolve()
    candidates: list[Path] = []
    if len(config_path.parents) > 2:
        candidates.append(config_path.parents[2] / ".env")
    candidates.extend([config_path.parent / ".env", Path.cwd() / ".env"])
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return str(candidates[0])


class Settings(BaseSettings):
    NODE_ENV: str = "development"
    API_PORT: int = 3001
    API_URL: str = "http://localhost:3001"
    CORS_ORIGINS: str = "http://localhost:3000"

    DATABASE_URL: str = "postgresql+asyncpg://aviva_user:aviva_password@localhost:5432/avivavirtual_db"
    REDIS_URL: str = "redis://localhost:6379"

    JWT_SECRET: str = "dev-jwt-secret-change-me"
    JWT_REFRESH_SECRET: str = "dev-refresh-secret-change-me"
    JWT_EXPIRES_IN: int = 900
    JWT_REFRESH_EXPIRES_IN: int = 604800
    BCRYPT_ROUNDS: int = 12
    ENCRYPTION_KEY: str = "dev-encryption-key-change-me-32"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    AI_CONFIDENCE_THRESHOLD: float = 0.75
    RAG_RETRIEVAL_TOP_K: int = 5
    RAG_MAX_SUBQUERIES: int = 4
    RAG_CONTEXT_WINDOW_TOKENS: int = 8192
    RAG_RESPONSE_TOKEN_BUDGET: int = 600
    RAG_MAX_CONTEXT_TOKENS: int = 1800

    WHISPER_PROVIDER: str = "openai"
    WHISPER_SELF_HOSTED_URL: str = ""
    WHISPER_API_SECRET: str = ""
    OPENAI_WHISPER_MODEL: str = "whisper-1"
    MAX_AUDIO_SIZE_MB: int = 25
    STORE_CALL_RECORDINGS: bool = True
    RECORDING_STORAGE_PATH: str = "./recordings"

    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_PATH: str = "./uploads"
    CF_R2_ENDPOINT: str = ""
    CF_R2_ACCESS_KEY: str = ""
    CF_R2_SECRET_KEY: str = ""
    CF_R2_BUCKET: str = ""
    CF_R2_PUBLIC_URL: str = ""
    CF_R2_RECORDINGS_BUCKET: str = ""

    VOIPMS_API_USERNAME: str = ""
    VOIPMS_API_PASSWORD: str = ""
    VOIPMS_DID: str = ""
    VOIPMS_SIP_SERVER: str = "toronto.voip.ms"
    VOIPMS_WEBRTC_SERVER: str = "webrtc.voip.ms"
    VOIPMS_ACCOUNT: str = ""
    VOIPMS_SIP_PASSWORD: str = ""

    SMTP_HOST: str = "smtp.brevo.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    EMAIL_FROM: str = "Avivavirtual <support@avivavirtual.ca>"

    RECORDING_RETAIN_DAYS: int = 90
    TRANSCRIPTION_RETAIN_DAYS: int = 365

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = _env_file()
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
