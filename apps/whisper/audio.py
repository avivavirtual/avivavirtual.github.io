import shutil
import subprocess
from pathlib import Path
from fastapi import UploadFile

async def save_upload(upload: UploadFile, directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / upload.filename.replace("/", "_")
    with target.open("wb") as handle:
        shutil.copyfileobj(upload.file, handle)
    return target

def convert_to_wav(source: Path) -> Path:
    target = source.with_suffix(".16k.wav")
    subprocess.run(["ffmpeg", "-y", "-i", str(source), "-ac", "1", "-ar", "16000", str(target)], check=True, capture_output=True)
    return target

def get_audio_duration(path: Path) -> float:
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)], check=True, capture_output=True, text=True)
    return float(result.stdout.strip())

def cleanup(*paths: Path) -> None:
    for path in paths:
        path.unlink(missing_ok=True)
