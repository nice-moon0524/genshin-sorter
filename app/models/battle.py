from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer

from app.db.base import Base


class BattleMatch(Base):
    __tablename__ = "battle_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    winner_id = Column(Integer, nullable=False, index=True)
    loser_id = Column(Integer, nullable=False, index=True)
    winner_score_after = Column(Integer, nullable=False)
    loser_score_after = Column(Integer, nullable=False)
    is_final = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

