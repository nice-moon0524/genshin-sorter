from __future__ import annotations

from pydantic import BaseModel, Field


class ChallengeCreateIn(BaseModel):
    mode: str = Field(min_length=1, max_length=24)
    question_id: str | None = Field(default=None, max_length=64)
    question_prompt: str = Field(min_length=1, max_length=256)


class ChallengeOut(BaseModel):
    code: str
    mode: str
    question_id: str | None
    question_prompt: str
    character_ids: list[int]
