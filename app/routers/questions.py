from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.question import CustomQuestionCreateIn, CustomQuestionOut
from app.services.auth_service import current_user_required
from app.services.question_service import create_question, list_questions


router = APIRouter(prefix="/api/questions", tags=["questions"])


def question_payload(question) -> CustomQuestionOut:
    return CustomQuestionOut(
        id=question.id,
        prompt=question.prompt,
        creator=question.creator,
        created_at=question.created_at,
    )


@router.get("", response_model=list[CustomQuestionOut])
def get_questions(db: Session = Depends(get_db)):
    return [question_payload(item) for item in list_questions(db)]


@router.post("", response_model=CustomQuestionOut, status_code=status.HTTP_201_CREATED)
def add_question(
    payload: CustomQuestionCreateIn,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = current_user_required(db, authorization)
    try:
        question = create_question(db, payload.prompt, user.username)
    except FileExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="这道题已经在自定义题库中了") from exc
    return question_payload(question)
