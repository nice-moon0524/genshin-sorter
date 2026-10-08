from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User


def ensure_admin_user(session: Session) -> None:
    if not settings.admin_username or not settings.admin_password:
        return
    user = session.execute(select(User).where(User.username == settings.admin_username)).scalar_one_or_none()
    if not user:
        user = User(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            level=1,
            is_admin=True,
        )
        session.add(user)
    else:
        user.is_admin = True
        if not verify_password(settings.admin_password, user.password_hash):
            user.password_hash = hash_password(settings.admin_password)
    session.flush()
