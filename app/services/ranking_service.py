from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.character import Character


def ranking_rows(session: Session, limit: int | None = None) -> list[Character]:
    stmt = select(Character).order_by(
        Character.score.desc(),
        Character.wins.desc(),
        Character.matches.asc(),
        Character.name.asc(),
    )
    if limit:
        stmt = stmt.limit(limit)
    return list(session.execute(stmt).scalars().all())

