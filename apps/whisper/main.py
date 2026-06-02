import asyncio
from contextlib import asynccontextmanager
import os

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import structlog

from audio import cleanup, convert_to_wav, save_upload
from auth import verify_api_key
from health import health_payload
from models import HealthResponse, TranscriptionResponse
from transcriber import transcriber

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, transcriber.load)
    logger.info("Whisper service ready")
    yield


app = FastAPI(
    title="Avivavirtual Whisper Service",
    description="Self-hosted speech-to-text - PIPEDA compliant (Toronto, CA)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("API_URL", "http://localhost:3001")],
    allow_methods=["POST", "GET"],
    allow_headers=["X-API-Key", "Content-Type"],
)

Instrumentator().instrument(app).expose(app)


@app.get("/health", response_model=HealthResponse)
async def health():
    return health_payload()


@app.get("/ready")
async def ready():
    if not transcriber.loaded:
        raise HTTPException(503, "Model still loading")
    return {"ready": True}


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    language: str = "auto",
    prompt: str | None = None,
    word_timestamps: bool = False,
    _: bool = Depends(verify_api_key),
):
    original = None
    wav = None
    try:
        original, file_size = await save_upload(file)
        wav = await convert_to_wav(original)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: transcriber.transcribe(
                wav,
                language=language if language != "auto" else None,
                prompt=prompt,
                word_timestamps=word_timestamps,
            ),
        )
        return TranscriptionResponse(**result, audio_size_bytes=file_size)
    except HTTPException:
        raise
    except (RuntimeError, OSError, ValueError) as exc:
        logger.error("Transcription failed", error=str(exc))
        raise HTTPException(500, f"Transcription failed: {exc}") from exc
    finally:
        cleanup(*filter(None, [original, wav]))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
