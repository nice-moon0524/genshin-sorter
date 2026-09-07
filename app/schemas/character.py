from __future__ import annotations

from pydantic import ConfigDict
from pydantic import BaseModel


class CharacterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str
    element: str
    rarity: int
    wins: int
    matches: int
    score: int
    championships: int
