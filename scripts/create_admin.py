from __future__ import annotations

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.db.session as db_session
from app.core.security import hash_password
from app.db.session import session_scope
from app.models.user import User


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        raise SystemExit("用法: python scripts/create_admin.py 管理员用户名")
    username = sys.argv[1].strip()
    password = getpass.getpass("管理员密码: ")
    confirmation = getpass.getpass("再次输入密码: ")
    if password != confirmation:
        raise SystemExit("两次密码不一致")
    if len(password) < 8:
        raise SystemExit("管理员密码至少需要 8 个字符")

    db_session.init_engine()
    db_session.init_schema()
    with session_scope() as db:
        user = db.query(User).filter(User.username == username).one_or_none()
        if not user:
            user = User(username=username, password_hash=hash_password(password), level=1, is_admin=True)
            db.add(user)
        else:
            user.password_hash = hash_password(password)
            user.is_admin = True
        db.flush()
    print(f"管理员账号已创建: {username}")


if __name__ == "__main__":
    main()
