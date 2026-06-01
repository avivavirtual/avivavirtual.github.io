import os
import shutil
import subprocess
from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException, UploadFile

CHUNK_SIZE = 1024 * 1024
DEFAULT_MAX_AUDIO_SIZE_MB = 25


def max_audio_size_bytes() -> int:
    configured = int(os.getenv("MAX_AUDIO_SIZE_MB", str(DEFAULT_MAX_AUDIO_SIZE_MB)))
    return configured * 1024 * 1024


async def save_upload(upload: UploadFile, directory: Path) -> Path:
    request_dir = directory / uuid4().hex
    request_dir.mkdir(parents=True, exist_ok=False)
    filename = Path(upload.filename or "upload.bin").name.replace("/", "_").replace("\\", "_")
    target = request_dir / filename
    written = 0
    limit = max_audio_size_bytes()
    try:
        with target.open("wb") as handle:
            while chunk := await upload.read(CHUNK_SIZE):
                written += len(chunk)
                if written > limit:
                    raise HTTPException(status_code=413, detail=f"Audio upload exceeds {limit} bytes")
                handle.write(chunk)
    except Exception:
        cleanup(target)
        raise
    return target


def convert_to_wav(source: Path) -> Path:
    target = source.with_suffix(".16k.wav")
    subprocess.run(["ffmpeg", "-y", "-i", str(source), "-ac", "1", "-ar", "16000", str(target)], check=True, capture_output=True)
    return target


def get_audio_duration(path: Path) -> float:
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)], check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def cleanup(*paths: Path) -> None:
    parents: set[Path] = set()
    for path in paths:
        if path:
            parents.add(path.parent)
            path.unlink(missing_ok=True)
    for parent in parents:
        shutil.rmtree(parent, ignore_errors=True)
