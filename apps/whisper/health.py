from fastapi import APIRouter, HTTPException
from models import HealthResponse
from transcriber import transcriber

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=transcriber.ready)

@router.get("/ready", response_model=HealthResponse)
def ready() -> HealthResponse:
    if not transcriber.ready:
        raise HTTPException(status_code=503, detail="Model loading")
    return HealthResponse(status="ready", model_loaded=True)
