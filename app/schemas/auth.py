from __future__ import annotations

from pydantic import ConfigDict
from pydantic import BaseModel, Field


class RegisterIn(BaseModel):
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=1, max_length=64)


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=1, max_length=64)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    level: int
    is_admin: bool = False


class AuthResponse(BaseModel):
    token: str
    user: UserOut
