from __future__ import annotations

from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.character import Character
from app.services.seed_data import CHARACTER_SEEDS
from app.services.character_catalog import build_character_records


def seed_characters(session: Session) -> None:
    count = session.execute(select(func.count(Character.id))).scalar_one()
    if count:
        return

    avatars_dir = Path(__file__).resolve().parent.parent / "static" / "avatars"
    records = build_character_records(avatars_dir)
    if not records:
        records = CHARACTER_SEEDS

    for index, item in enumerate(records, start=1):
        name = str(item["name"])
        avatar_url = str(item["avatar_url"])
        element = str(item.get("element", "未标注"))
        rarity = int(item.get("rarity", 4))
        session.add(
            Character(
                id=index,
                name=name,
                avatar_url=avatar_url,
                element=element,
                rarity=rarity,
                wins=0,
                matches=0,
                score=1000,
                championships=0,
            )
        )
    session.flush()
