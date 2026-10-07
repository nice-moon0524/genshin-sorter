from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.custom_question import CustomQuestion


def normalize_prompt(prompt: str) -> tuple[str, str]:
    cleaned = re.sub(r"\s+", " ", prompt).strip()
    return cleaned, cleaned.casefold()


def list_questions(session: Session) -> list[CustomQuestion]:
    return list(session.execute(select(CustomQuestion).order_by(CustomQuestion.id.asc())).scalars())


def create_question(session: Session, prompt: str, creator: str) -> CustomQuestion:
    cleaned, normalized = normalize_prompt(prompt)
    if len(cleaned) < 4:
        raise ValueError("题目至少需要 4 个字符")
    if len(cleaned) > 80:
        raise ValueError("题目不能超过 80 个字符")

    exists = session.execute(
        select(CustomQuestion).where(CustomQuestion.normalized_prompt == normalized)
    ).scalar_one_or_none()
    if exists:
        raise FileExistsError("这道题已经在自定义题库中了")

    question = CustomQuestion(prompt=cleaned, normalized_prompt=normalized, creator=creator)
    session.add(question)
    session.flush()
    return question
