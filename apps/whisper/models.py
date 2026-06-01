from pydantic import BaseModel

class TranscriptionResponse(BaseModel):
    text: str
    language: str | None = None
    duration_seconds: float | None = None
    model: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
