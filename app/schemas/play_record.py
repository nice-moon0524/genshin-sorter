from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PlayRecordCreateIn(BaseModel):
    record_key: str = Field(min_length=8, max_length=64)
    visitor_id: str | None = Field(default=None, max_length=64)
    mode: str = Field(min_length=1, max_length=24)
    question_id: str | None = Field(default=None, max_length=80)
    question_prompt: str = Field(min_length=1, max_length=256)
    result_summary: str = Field(min_length=1, max_length=1000)
    challenge_code: str | None = Field(default=None, max_length=32)


class PlayRecordOut(BaseModel):
    id: int
    player_label: str
    player_type: str
    mode: str
    question_prompt: str
    result_summary: str
    challenge_code: str | None
    created_at: datetime


class AdminUserOut(BaseModel):
    id: int
    username: str
    level: int
    is_admin: bool
    play_count: int
    created_at: datetime


class AdminOverviewOut(BaseModel):
    registered_users: int
    guest_players: int
    total_plays: int
    users: list[AdminUserOut]
    records: list[PlayRecordOut]
