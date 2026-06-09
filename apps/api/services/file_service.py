from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
import aiofiles

from config import settings

ALLOWED = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
}
MAX_BYTES = 10 * 1024 * 1024


async def store_upload(file: UploadFile) -> dict:
    mime = file.content_type or "application/octet-stream"
    if mime not in ALLOWED:
        raise HTTPException(400, f"Unsupported MIME type: {mime}")
    root = Path(settings.LOCAL_STORAGE_PATH)
    root.mkdir(parents=True, exist_ok=True)
    safe_name = (file.filename or "upload").replace("/", "_")
    file_id = str(uuid4())
    path = root / f"{file_id}-{safe_name}"
    total = 0
    async with aiofiles.open(path, "wb") as out:
        while chunk := await file.read(65536):
            total += len(chunk)
            if total > MAX_BYTES:
                path.unlink(missing_ok=True)
                raise HTTPException(413, "File exceeds 10MB")
            await out.write(chunk)
    return {"id": file_id, "file_name": safe_name, "mime_type": mime, "size_bytes": total, "storage_url": str(path)}


def resolve_file(file_id: str) -> Path | None:
    try:
        UUID(file_id)
    except ValueError:
        return None
    root = Path(settings.LOCAL_STORAGE_PATH)
    matches = list(root.glob(f"{file_id}-*"))
    return matches[0] if matches else None
