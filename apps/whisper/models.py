from typing import Optional

from pydantic import BaseModel


class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str
    avg_logprob: Optional[float] = None


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float
    segments: list[TranscriptionSegment] = []
    model: str
    processing_time_seconds: float
    audio_size_bytes: int


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_size: str
    device: str
    uptime_seconds: float
