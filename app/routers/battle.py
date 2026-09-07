from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

import app.db.session as db_session
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.battle import BattleInitOut, BattleResultIn, BattleResultOut
from app.schemas.character import CharacterOut
from app.schemas.ranking import RankingItem
from app.db.session import get_db
from app.services.auth_service import resolve_current_user, user_payload
from app.services.battle_service import apply_battle_result
from app.services.ranking_service import ranking_rows
from app.models.character import Character

router = APIRouter(prefix="/api/battle", tags=["battle"])


@router.get("/init", response_model=BattleInitOut)
def battle_init(db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = resolve_current_user(db, authorization)
    characters = db.query(Character).order_by(Character.name.asc()).all()
    return BattleInitOut(
        backend=db_session.runtime_backend,
        user=UserOut(**user_payload(user)) if user else None,
        characters=[CharacterOut.model_validate(item) for item in characters],
    )


@router.post("/result", response_model=BattleResultOut)
def battle_result(
    payload: BattleResultIn,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = resolve_current_user(db, authorization)
    try:
        winner, loser = apply_battle_result(db, payload.winner_id, payload.loser_id, payload.tournament_complete)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if payload.tournament_complete and user:
        managed_user = db.get(User, user.id)
        if managed_user:
            managed_user.level += 1
            user.level = managed_user.level

    leaderboard = ranking_rows(db)
    return BattleResultOut(
        winner=CharacterOut.model_validate(winner),
        loser=CharacterOut.model_validate(loser),
        leaderboard=[] if not leaderboard else [
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
            for index, item in enumerate(leaderboard)
        ],
        user=UserOut(**user_payload(user)) if user else None,
    )
