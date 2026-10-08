from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base


runtime_backend = "unknown"
runtime_database_url = ""
engine = None
SessionLocal = None


def _build_engine(database_url: str):
    connect_args = {}
    if database_url.startswith("sqlite"):
        settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        connect_args["check_same_thread"] = False
    return create_engine(
        database_url,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


def _candidate_urls() -> list[tuple[str, str]]:
    urls: list[tuple[str, str]] = []
    if settings.database_url:
        urls.append((settings.db_backend if settings.db_backend != "auto" else "custom", settings.database_url))
    if settings.db_backend in {"auto", "mysql"}:
        urls.append(("mysql", settings.mysql_url()))
    if settings.db_auto_fallback or settings.db_backend in {"auto", "sqlite"}:
        urls.append(("sqlite", settings.sqlite_url()))
    return urls


def init_engine() -> tuple[str, str]:
    global engine, SessionLocal, runtime_backend, runtime_database_url

    last_error: Exception | None = None
    for backend, database_url in _candidate_urls():
        try:
            candidate_engine = _build_engine(database_url)
            with candidate_engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            engine = candidate_engine
            SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
            runtime_backend = backend
            runtime_database_url = database_url
            return runtime_backend, runtime_database_url
        except Exception as exc:  # pragma: no cover - startup fallback path
            last_error = exc
            if backend == "sqlite" and settings.db_backend == "sqlite":
                raise
            continue

    if last_error:
        raise last_error
    raise RuntimeError("No database backend could be initialized.")


def init_schema() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    if "characters" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("characters")}
        if "championships" not in columns:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE characters ADD COLUMN championships INTEGER NOT NULL DEFAULT 0"
                    )
                )
    if "users" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "is_admin" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))


@contextmanager
def session_scope():
    if SessionLocal is None:
        raise RuntimeError("Database engine is not initialized.")
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db():
    if SessionLocal is None:
        raise RuntimeError("Database engine is not initialized.")
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
