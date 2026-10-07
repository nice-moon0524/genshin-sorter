from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base import Base


class CustomQuestion(Base):
    __tablename__ = "custom_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt = Column(String(80), nullable=False)
    normalized_prompt = Column(String(80), nullable=False, unique=True, index=True)
    creator = Column(String(64), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
