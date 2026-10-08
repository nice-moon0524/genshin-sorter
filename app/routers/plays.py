from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.play_record import PlayRecord
from app.models.user import User
from app.schemas.play_record import AdminOverviewOut, AdminUserOut, PlayRecordCreateIn, PlayRecordOut
from app.services.auth_service import admin_user_required, resolve_current_user


router = APIRouter(prefix="/api", tags=["plays"])


def record_payload(record: PlayRecord) -> PlayRecordOut:
    return PlayRecordOut(
        id=record.id,
        player_label=record.player_label,
        player_type="user" if record.user_id else "guest",
        mode=record.mode,
        question_prompt=record.question_prompt,
        result_summary=record.result_summary,
        challenge_code=record.challenge_code,
        created_at=record.created_at,
    )


@router.post("/plays", response_model=PlayRecordOut)
def create_play_record(
    payload: PlayRecordCreateIn,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    existing = db.query(PlayRecord).filter(PlayRecord.record_key == payload.record_key).one_or_none()
    if existing:
        return record_payload(existing)

    user = resolve_current_user(db, authorization)
    visitor_id = None if user else (payload.visitor_id or "unknown")
    player_label = user.username if user else f"游客-{visitor_id[-6:]}"
    record = PlayRecord(
        record_key=payload.record_key,
        user_id=user.id if user else None,
        visitor_id=visitor_id,
        player_label=player_label,
        mode=payload.mode,
        question_id=payload.question_id,
        question_prompt=payload.question_prompt.strip(),
        result_summary=payload.result_summary.strip(),
        challenge_code=payload.challenge_code,
    )
    db.add(record)
    db.flush()
    return record_payload(record)


@router.get("/admin/overview", response_model=AdminOverviewOut)
def admin_overview(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    admin_user_required(db, authorization)
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    play_counts = dict(
        db.query(PlayRecord.user_id, func.count(PlayRecord.id))
        .filter(PlayRecord.user_id.is_not(None))
        .group_by(PlayRecord.user_id)
        .all()
    )
    records = db.query(PlayRecord).order_by(PlayRecord.created_at.desc()).limit(200).all()
    guest_players = db.query(func.count(func.distinct(PlayRecord.visitor_id))).filter(
        PlayRecord.user_id.is_(None),
        PlayRecord.visitor_id.is_not(None),
    ).scalar() or 0
    return AdminOverviewOut(
        registered_users=db.query(func.count(User.id)).scalar() or 0,
        guest_players=guest_players,
        total_plays=db.query(func.count(PlayRecord.id)).scalar() or 0,
        users=[
            AdminUserOut(
                id=user.id,
                username=user.username,
                level=user.level,
                is_admin=bool(user.is_admin),
                play_count=play_counts.get(user.id, 0),
                created_at=user.created_at,
            )
            for user in users
        ],
        records=[record_payload(record) for record in records],
    )
