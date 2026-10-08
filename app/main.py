from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
import app.db.session as db_session
from app.routers.auth import router as auth_router
from app.routers.battle import router as battle_router
from app.routers.challenges import router as challenges_router
from app.routers.questions import router as questions_router
from app.routers.plays import router as plays_router
from app.routers.ranking import router as ranking_router
from app.services.seed_service import seed_characters
from app.services.admin_service import ensure_admin_user
from app.db.session import session_scope


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Genshin Sorter", version="0.1.0")

origins = [item.strip() for item in settings.cors_origins.split(",") if item.strip()] if settings.cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.include_router(auth_router)
app.include_router(battle_router)
app.include_router(challenges_router)
app.include_router(questions_router)
app.include_router(plays_router)
app.include_router(ranking_router)


@app.on_event("startup")
def startup() -> None:
    db_session.init_engine()
    db_session.init_schema()
    with session_scope() as db:
        seed_characters(db)
        ensure_admin_user(db)


@app.get("/api/health")
def health():
    return JSONResponse(
        {
            "ok": True,
            "backend": db_session.runtime_backend,
            "database_url": db_session.runtime_database_url,
            "app_env": settings.app_env,
        }
    )


@app.get("/")
def index():
    return FileResponse(
        STATIC_DIR / "index.html",
        headers={"Cache-Control": "no-store"},
    )
