from fastapi import APIRouter, Depends, HTTPException

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
    # Stub: no Stripe SDK or STRIPE_* credentials are configured yet, so there is
    # no signature verification here. Returning 501 (instead of `{"received": True}`)
    # so this can't be mistaken for a working, verified webhook. Before pointing a
    # real Stripe endpoint here, add the `stripe` dependency, a STRIPE_WEBHOOK_SECRET
    # setting, and verify the request with `stripe.Webhook.construct_event(...)`.
    raise HTTPException(501, "Stripe webhook is not yet implemented")
