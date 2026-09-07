from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginIn, RegisterIn, UserOut
from app.services.auth_service import (
    authenticate_user,
    create_user,
    issue_user_token,
    resolve_current_user,
    user_payload,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    user = create_user(db, payload.username.strip(), payload.password)
    token = issue_user_token(user)
    return AuthResponse(token=token, user=UserOut(**user_payload(user)))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username.strip(), payload.password)
    token = issue_user_token(user)
    return AuthResponse(token=token, user=UserOut(**user_payload(user)))


@router.get("/me", response_model=UserOut | None)
def me(db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = resolve_current_user(db, authorization)
    if not user:
        return None
    return UserOut(**user_payload(user))
