from __future__ import annotations

import json
import secrets

from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.models.character import Character


MODE_CHARACTER_COUNTS: dict[str, int | None] = {
    "quick": 8,
    "standard": 16,
    "full": None,
    "guess": 10,
}


def create_challenge(
    session: Session,
    mode: str,
    question_id: str | None,
    question_prompt: str,
) -> Challenge:
    if mode not in MODE_CHARACTER_COUNTS:
        raise ValueError("玩法不存在")

    characters = list(session.query(Character).order_by(Character.id.asc()).all())
    if len(characters) < 2:
        raise ValueError("角色数量不足，无法创建挑战")

    secrets.SystemRandom().shuffle(characters)
    count = MODE_CHARACTER_COUNTS[mode]
    if count is not None:
        characters = characters[: min(count, len(characters))]

    if mode != "guess" and len(characters) < 2:
        raise ValueError("角色数量不足，无法创建挑战")

    while True:
        code = secrets.token_urlsafe(9)
        exists = session.query(Challenge.id).filter(Challenge.code == code).first()
        if not exists:
            break

    challenge = Challenge(
        code=code,
        mode=mode,
        question_id=question_id,
        question_prompt=question_prompt,
        character_ids=json.dumps([item.id for item in characters]),
    )
    session.add(challenge)
    session.flush()
    return challenge


def challenge_payload(challenge: Challenge) -> dict[str, object]:
    return {
        "code": challenge.code,
        "mode": challenge.mode,
        "question_id": challenge.question_id,
        "question_prompt": challenge.question_prompt,
        "character_ids": json.loads(challenge.character_ids),
    }
