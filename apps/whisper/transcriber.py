import os
from pathlib import Path
import threading
import time
from typing import Optional

from faster_whisper import WhisperModel
import structlog

from models import TranscriptionSegment

logger = structlog.get_logger()

MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "medium")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

DEFAULT_PROMPT = (
    "Customer support call. May include account numbers, technical terms, software names, "
    "and billing discussions. The conversation may switch between English and French."
)


class WhisperTranscriber:
    _instance: Optional["WhisperTranscriber"] = None
    _class_lock = threading.Lock()

    def __init__(self) -> None:
        self.model: Optional[WhisperModel] = None
        self.loaded = False
        self.started_at = time.time()
        self._lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "WhisperTranscriber":
        if cls._instance is None:
            with cls._class_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def load(self) -> None:
        logger.info("Loading Whisper model", model=MODEL_SIZE, device=DEVICE)
        start = time.time()
        self.model = WhisperModel(
            MODEL_SIZE,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            download_root="/app/models",
            cpu_threads=os.cpu_count() or 4,
            num_workers=1,
        )
        self.loaded = True
        logger.info("Model loaded", seconds=round(time.time() - start, 2))

    def transcribe(self, audio_path: Path, language: Optional[str] = None, prompt: Optional[str] = None, word_timestamps: bool = False) -> dict:
        if not self.loaded or not self.model:
            raise RuntimeError("Model not loaded")
        effective_language = None if language in (None, "auto") else language
        start = time.time()
        with self._lock:
            segments_gen, info = self.model.transcribe(
                str(audio_path),
                language=effective_language,
                task="transcribe",
                initial_prompt=prompt or DEFAULT_PROMPT,
                word_timestamps=word_timestamps,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500, "speech_pad_ms": 400},
                beam_size=5,
                temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
                no_speech_threshold=0.6,
                log_prob_threshold=-1.0,
            )
            segments: list[TranscriptionSegment] = []
            parts: list[str] = []
            for segment in segments_gen:
                segments.append(
                    TranscriptionSegment(
                        start=round(segment.start, 2),
                        end=round(segment.end, 2),
                        text=segment.text.strip(),
                        avg_logprob=round(segment.avg_logprob, 4) if segment.avg_logprob else None,
                    )
                )
                parts.append(segment.text.strip())
        return {
            "text": " ".join(parts),
            "language": info.language or (language if language not in (None, "auto") else "en"),
            "duration": round(info.duration or 0, 2),
            "segments": segments,
            "model": f"faster-whisper-{MODEL_SIZE}",
            "processing_time_seconds": round(time.time() - start, 2),
        }


transcriber = WhisperTranscriber.get_instance()
