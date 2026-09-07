from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(slots=True)
class Settings:
    app_host: str = os.getenv("APP_HOST", "0.0.0.0")
    app_port: int = int(os.getenv("APP_PORT", "8080"))
    app_env: str = os.getenv("APP_ENV", "development")

    db_backend: str = os.getenv("DB_BACKEND", "auto").lower()
    database_url: str = os.getenv("DATABASE_URL", "").strip()

    mysql_host: str = os.getenv("MYSQL_HOST", "127.0.0.1")
    mysql_port: int = int(os.getenv("MYSQL_PORT", "3306"))
    mysql_user: str = os.getenv("MYSQL_USER", "root")
    mysql_password: str = os.getenv("MYSQL_PASSWORD", "")
    mysql_database: str = os.getenv("MYSQL_DATABASE", "genshin_sorter")

    sqlite_path: Path = Path(os.getenv("SQLITE_PATH", "./data.db"))
    db_auto_fallback: bool = os.getenv("DB_AUTO_FALLBACK", "true").lower() in {"1", "true", "yes", "on"}

    cors_origins: str = os.getenv("CORS_ORIGINS", "*")
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

    def mysql_url(self) -> str:
        from urllib.parse import quote_plus

        password = quote_plus(self.mysql_password)
        user = quote_plus(self.mysql_user)
        host = self.mysql_host
        port = self.mysql_port
        database = self.mysql_database
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"

    def sqlite_url(self) -> str:
        return f"sqlite:///{self.sqlite_path.as_posix()}"


settings = Settings()

