from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CustomQuestionCreateIn(BaseModel):
    prompt: str = Field(min_length=4, max_length=80)


class CustomQuestionOut(BaseModel):
    id: int
    prompt: str
    creator: str
    created_at: datetime
