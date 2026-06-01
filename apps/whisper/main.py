from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import Depends, FastAPI, UploadFile
from prometheus_fastapi_instrumentator import Instrumentator
from auth import require_configured_secret, verify_api_key
from audio import cleanup, convert_to_wav, get_audio_duration, save_upload
from health import router as health_router
from models import TranscriptionResponse
from transcriber import transcriber

@asynccontextmanager
async def lifespan(app: FastAPI):
    require_configured_secret()
    transcriber.load()
    yield

app = FastAPI(title="AvivaVirtual Whisper", lifespan=lifespan)
app.include_router(health_router)
Instrumentator().instrument(app).expose(app)

@app.post("/transcribe", response_model=TranscriptionResponse, dependencies=[Depends(verify_api_key)])
async def transcribe(file: UploadFile) -> TranscriptionResponse:
    upload = None
    wav = None
    try:
        upload = await save_upload(file, Path("/tmp/avivavirtual-whisper"))
        wav = convert_to_wav(upload)
        duration = get_audio_duration(wav)
        text, language = transcriber.transcribe(wav)
        return TranscriptionResponse(text=text, language=language, duration_seconds=duration, model=transcriber.model_size)
    finally:
        cleanup(*(path for path in (upload, wav) if path is not None))
