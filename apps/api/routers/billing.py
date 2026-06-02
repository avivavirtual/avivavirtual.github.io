from fastapi import APIRouter, Depends

from middleware.auth import get_current_user

router = APIRouter()


@router.get("/plan")
async def plan(current_user=Depends(get_current_user)):
    return {"plan": "Starter", "status": "active", "contact": "billing@avivavirtual.ca"}


@router.post("/upgrade")
async def upgrade(current_user=Depends(get_current_user)):
    return {"ok": True, "message": "Upgrade intent logged", "contact": "billing@avivavirtual.ca"}


@router.post("/webhook/stripe")
async def stripe_webhook():
    return {"received": True}
