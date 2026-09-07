from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_token, decode_token, hash_password, verify_password
from app.models.user import User


def create_user(session: Session, username: str, password: str) -> User:
    exists = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
    user = User(username=username, password_hash=hash_password(password), level=1)
    session.add(user)
    session.flush()
    return user


def authenticate_user(session: Session, username: str, password: str) -> User:
    user = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    return user


def issue_user_token(user: User) -> str:
    return create_token(user.id, user.username)


def user_payload(user: User) -> dict:
    return {"id": user.id, "username": user.username, "level": user.level}


def resolve_current_user(session: Session, authorization: str | None) -> User | None:
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    try:
        user_id, _ = decode_token(token)
    except Exception:
        return None
    return session.get(User, user_id)


def current_user_required(session: Session, authorization: str | None) -> User:
    user = resolve_current_user(session, authorization)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="请先登录")
    return user
