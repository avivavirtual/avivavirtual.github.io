from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import socketio
import structlog

from config import settings
from database import create_tables
from middleware.logging import SecurityHeadersMiddleware
from middleware.rate_limit import limiter
from routers import (
    ai,
    analytics,
    audit_logs,
    auth,
    billing,
    conversations,
    files,
    knowledge_base,
    messages,
    notifications,
    organizations,
    tickets,
    users,
    voip,
)
from socketio_app import sio

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Avivavirtual API")
    if settings.NODE_ENV == "development":
        await create_tables()
    yield
    logger.info("Shutting down Avivavirtual API")


app = FastAPI(
    title="Avivavirtual API",
    description="AI-powered customer care platform for Canadian businesses",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

Instrumentator().instrument(app).expose(app)

prefix = "/api/v1"
app.include_router(auth.router, prefix=f"{prefix}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{prefix}/users", tags=["users"])
app.include_router(organizations.router, prefix=f"{prefix}/organizations", tags=["organizations"])
app.include_router(conversations.router, prefix=f"{prefix}/conversations", tags=["conversations"])
app.include_router(messages.router, prefix=f"{prefix}/messages", tags=["messages"])
app.include_router(tickets.router, prefix=f"{prefix}/tickets", tags=["tickets"])
app.include_router(knowledge_base.router, prefix=f"{prefix}/knowledge-base", tags=["knowledge-base"])
app.include_router(ai.router, prefix=f"{prefix}/ai", tags=["ai"])
app.include_router(analytics.router, prefix=f"{prefix}/analytics", tags=["analytics"])
app.include_router(audit_logs.router, prefix=f"{prefix}/audit-logs", tags=["audit-logs"])
app.include_router(notifications.router, prefix=f"{prefix}/notifications", tags=["notifications"])
app.include_router(files.router, prefix=f"{prefix}/files", tags=["files"])
app.include_router(voip.router, prefix=f"{prefix}/voip", tags=["voip"])
app.include_router(billing.router, prefix=f"{prefix}/billing", tags=["billing"])

socket_app = socketio.ASGIApp(sio, app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=settings.NODE_ENV == "development",
        workers=1,
    )
