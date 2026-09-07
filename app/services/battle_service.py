from __future__ import annotations

import math
from sqlalchemy.orm import Session

from app.models.battle import BattleMatch
from app.models.character import Character


def elo_expected(score_a: int, score_b: int) -> float:
    return 1 / (1 + math.pow(10, (score_b - score_a) / 400))


def apply_battle_result(session: Session, winner_id: int, loser_id: int, is_final: bool = False) -> tuple[Character, Character]:
    winner = session.get(Character, winner_id)
    loser = session.get(Character, loser_id)
    if not winner or not loser:
        raise ValueError("角色不存在")
    if winner.id == loser.id:
        raise ValueError("不能同一角色对战")

    winner_expected = elo_expected(winner.score, loser.score)
    loser_expected = elo_expected(loser.score, winner.score)
    k_factor = 32

    winner.score = round(winner.score + k_factor * (1 - winner_expected))
    loser.score = round(loser.score + k_factor * (0 - loser_expected))
    winner.wins += 1
    winner.matches += 1
    loser.matches += 1
    if is_final:
        winner.championships += 1

    session.add(
        BattleMatch(
            winner_id=winner.id,
            loser_id=loser.id,
            winner_score_after=winner.score,
            loser_score_after=loser.score,
            is_final=is_final,
        )
    )
    session.flush()
    return winner, loser
