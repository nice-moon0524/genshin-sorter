from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.challenge import ChallengeCreateIn, ChallengeOut
from app.services.challenge_service import challenge_payload, create_challenge
from app.models.challenge import Challenge


router = APIRouter(prefix="/api/challenges", tags=["challenges"])


@router.post("", response_model=ChallengeOut)
def create(payload: ChallengeCreateIn, db: Session = Depends(get_db)):
    try:
        challenge = create_challenge(
            db,
            payload.mode,
            payload.question_id,
            payload.question_prompt.strip(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return challenge_payload(challenge)


@router.get("/{code}", response_model=ChallengeOut)
def get(code: str, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.code == code).one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="挑战链接不存在或已失效")
    return challenge_payload(challenge)
