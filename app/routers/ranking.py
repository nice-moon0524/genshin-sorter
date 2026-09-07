from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ranking import RankingItem
from app.services.ranking_service import ranking_rows

router = APIRouter(prefix="/api", tags=["ranking"])


@router.get("/ranking", response_model=list[RankingItem])
def ranking(db: Session = Depends(get_db), limit: int | None = Query(default=None, ge=1, le=100)):
    rows = ranking_rows(db, limit=limit)
    return [
        RankingItem(
            rank=index + 1,
            id=item.id,
            name=item.name,
            avatar_url=item.avatar_url,
            element=item.element,
            rarity=item.rarity,
            wins=item.wins,
            matches=item.matches,
            win_rate=round(item.wins / item.matches * 100, 2) if item.matches else 0.0,
            score=item.score,
            championships=item.championships,
        )
        for index, item in enumerate(rows)
    ]
