from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse

from middleware.auth import get_current_user
from services import file_service

router = APIRouter()


@router.post("/upload", status_code=201)
async def upload(file: UploadFile, current_user=Depends(get_current_user)):
    return await file_service.store_upload(file)


@router.get("/{file_id}")
async def get_file(file_id: str, current_user=Depends(get_current_user)):
    path = file_service.resolve_file(file_id)
    if not path:
        raise HTTPException(404, "File not found")
    return FileResponse(path)
