import asyncio
import os
from pathlib import Path
import uuid

import aiofiles
from fastapi import HTTPException, UploadFile

TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/whisper")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "25"))

ALLOWED_MIME_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
    "audio/m4a",
    "audio/x-m4a",
}


async def save_upload(file: UploadFile) -> tuple[Path, int]:
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"Unsupported format: {file.content_type}")
    Path(TEMP_DIR).mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "audio.mp3").suffix or ".mp3"
    file_path = Path(TEMP_DIR) / f"{uuid.uuid4()}{ext}"
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    total = 0
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(65536):
            total += len(chunk)
            if total > max_bytes:
                file_path.unlink(missing_ok=True)
                raise HTTPException(413, f"File too large. Max: {MAX_FILE_SIZE_MB}MB")
            await f.write(chunk)
    return file_path, total


async def convert_to_wav(input_path: Path) -> Path:
    output_path = input_path.with_suffix(".wav")
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-i",
        str(input_path),
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        "-y",
        str(output_path),
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await proc.communicate()
    if proc.returncode != 0:
        raise HTTPException(422, "Audio conversion failed")
    return output_path


def cleanup(*paths: Path) -> None:
    for path in paths:
        if path:
            path.unlink(missing_ok=True)
