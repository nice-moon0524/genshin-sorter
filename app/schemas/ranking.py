from __future__ import annotations

from pydantic import ConfigDict
from pydantic import BaseModel


class RankingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    id: int
    name: str
    avatar_url: str
    element: str
    rarity: int
    wins: int
    matches: int
    win_rate: float
    score: int
    championships: int
