from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.character import CharacterOut
from app.schemas.ranking import RankingItem
from app.schemas.auth import UserOut


class BattleResultIn(BaseModel):
    winner_id: int = Field(gt=0)
    loser_id: int = Field(gt=0)
    tournament_complete: bool = False


class BattleInitOut(BaseModel):
    backend: str
    user: UserOut | None
    characters: list[CharacterOut]


class BattleResultOut(BaseModel):
    winner: CharacterOut
    loser: CharacterOut
    leaderboard: list[RankingItem]
    user: UserOut | None = None

