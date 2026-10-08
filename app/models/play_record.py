from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.db.base import Base


class PlayRecord(Base):
    __tablename__ = "play_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_key = Column(String(64), nullable=False, unique=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    visitor_id = Column(String(64), nullable=True, index=True)
    player_label = Column(String(80), nullable=False)
    mode = Column(String(24), nullable=False, index=True)
    question_id = Column(String(80), nullable=True)
    question_prompt = Column(String(256), nullable=False)
    result_summary = Column(Text, nullable=False)
    challenge_code = Column(String(32), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
