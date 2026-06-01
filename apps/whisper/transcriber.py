import os
import threading
from pathlib import Path
from faster_whisper import WhisperModel

class Transcriber:
    def __init__(self) -> None:
        self.model_size = os.getenv("WHISPER_MODEL_SIZE", "medium")
        self.model: WhisperModel | None = None
        self._inference_lock = threading.Lock()

    def load(self) -> None:
        self.model = WhisperModel(self.model_size, device=os.getenv("WHISPER_DEVICE", "cpu"), compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"), download_root="/app/models")

    @property
    def ready(self) -> bool:
        return self.model is not None

    def transcribe(self, path: Path) -> tuple[str, str | None]:
        if self.model is None:
            raise RuntimeError("Whisper model is not loaded")
        with self._inference_lock:
            segments, info = self.model.transcribe(str(path), vad_filter=True, initial_prompt="Customer support call. May include account numbers, billing discussions, both English and French.", temperature=[0.0,0.2,0.4,0.6,0.8,1.0])
            return " ".join(segment.text.strip() for segment in segments), info.language

transcriber = Transcriber()
