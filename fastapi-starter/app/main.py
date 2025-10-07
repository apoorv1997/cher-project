from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.database import init_db, engine, get_session
from app.routers import auth, leads, activities, dashboard
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

app = FastAPI(title="CRM API (async)", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.exception_handler(IntegrityError)
async def handle_integrity(_: Request, exc: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "Conflict: duplicate or invalid data"})

@app.get("/", tags=["health"])
async def health():
    return {"status": "ok"}

# --- debug: confirm async engine & driver ---
@app.get("/__debug/db")
async def debug_db():
    return {
        "engine_class": str(type(engine)),
        "url": str(engine.url),
        "is_async": getattr(engine.dialect, "is_async", False),
        "driver": engine.url.get_backend_name() + "+" + engine.url.get_driver_name(),
    }

@app.get("/__debug/db")
async def debug_db():
    return {
        "engine_class": str(type(engine)),
        "url": str(engine.url),
        "is_async": getattr(engine.dialect, "is_async", False),
        "driver": engine.url.get_backend_name() + "+" + engine.url.get_driver_name(),
    }

@app.get("/__debug/ping")
async def debug_ping(session: AsyncSession = Depends(get_session)):
    result = await session.exec(sa_select(1))
    return {"ok": True, "select_one": result.scalar_one()}

app.include_router(auth.router)
app.include_router(leads.router)       # /api/leads/*
app.include_router(activities.router)  # /api/leads/{lead_id}/activities/*
app.include_router(dashboard.router)
# (add your other routers back after this works)
