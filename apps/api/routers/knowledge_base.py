from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.tenant import scoped_org
from schemas import ArticleCreate, ArticlePatch
from services import ai_service, knowledge_base_service

router = APIRouter()


@router.get("")
async def list_articles(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.list_articles(db, scoped_org(current_user))


@router.get("/search")
async def search(q: str, limit: int = 5, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.semantic_search(db, scoped_org(current_user), q, limit)


@router.post("/experiments/kaggle/upload", status_code=201)
async def kaggle_upload(
    file: UploadFile = File(...),
    title_column: str | None = Form(None),
    content_column: str | None = Form(None),
    tags_column: str | None = Form(None),
    limit: int = Form(50),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await knowledge_base_service.import_kaggle_csv(db, file, current_user, title_column, content_column, tags_column, limit)


@router.post("/experiments/keggle/upload", status_code=201)
async def keggle_upload_alias(
    file: UploadFile = File(...),
    title_column: str | None = Form(None),
    content_column: str | None = Form(None),
    tags_column: str | None = Form(None),
    limit: int = Form(50),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await knowledge_base_service.import_kaggle_csv(db, file, current_user, title_column, content_column, tags_column, limit)


@router.post("/upload", status_code=201)
async def upload(file: UploadFile, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.upload_article(db, file, current_user)


@router.get("/{article_id}")
async def get_article(article_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.get_article(db, article_id, scoped_org(current_user))


@router.post("", status_code=201)
async def create_article(payload: ArticleCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.create_article(db, payload, current_user)


@router.patch("/{article_id}")
async def patch_article(article_id: str, payload: ArticlePatch, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.patch_article(db, article_id, payload, current_user)


@router.delete("/{article_id}")
async def delete_article(article_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await knowledge_base_service.delete_article(db, article_id, scoped_org(current_user))


@router.post("/{article_id}/publish")
async def publish(article_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    article = await knowledge_base_service.publish_article(db, article_id, current_user)
    await ai_service.index_article(db, article.id, article.organization_id)
    return article
