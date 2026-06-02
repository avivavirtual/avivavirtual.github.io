import os
import time

from models import HealthResponse
from transcriber import transcriber, DEVICE, MODEL_SIZE


def health_payload() -> HealthResponse:
    return HealthResponse(
        status="ok" if transcriber.loaded else "loading",
        model_loaded=transcriber.loaded,
        model_size=MODEL_SIZE,
        device=os.getenv("WHISPER_DEVICE", DEVICE),
        uptime_seconds=round(time.time() - transcriber.started_at, 2),
    )
