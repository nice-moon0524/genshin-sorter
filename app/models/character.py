from __future__ import annotations

from sqlalchemy import Column, Integer, String

from app.db.base import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), nullable=False, unique=True, index=True)
    avatar_url = Column(String(512), nullable=False)
    element = Column(String(32), nullable=False)
    rarity = Column(Integer, nullable=False)
    wins = Column(Integer, nullable=False, default=0)
    matches = Column(Integer, nullable=False, default=0)
    score = Column(Integer, nullable=False, default=1000)
    championships = Column(Integer, nullable=False, default=0)
