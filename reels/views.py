from fastapi import HTTPException
from sqlalchemy.orm import Session

from reels.models import Reel, ReelView
from reels.schemas import ReelCreate, ReelWatchUpdate
from users.permissions import can_view_content


def create_reel(data: ReelCreate, db: Session, user_id: int):
    new_reel = Reel(
        user_id=user_id,
        video_url=data.video_url,
        description=data.description,
        hashtag=data.hashtag,
    )

    db.add(new_reel)
    db.commit()
    db.refresh(new_reel)

    return new_reel


def get_reel(reels_id: int, db: Session, current_user_id: int):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, current_user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this reels")

    return reels


def get_user_reels(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    reels = db.query(Reel).filter(Reel.user_id == user_id).order_by(Reel.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(reels) > limit
    reels = reels[:limit]

    return {
        "reels": reels,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def update_reel_view(reels_id: int, data: ReelWatchUpdate, db: Session, user_id: int):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this reels")

    reel_view = db.query(ReelView).filter(ReelView.reels_id == reels_id, ReelView.user_id == user_id).first()

    if reel_view is None:
        reel_view = ReelView(
            reels_id=reels_id,
            user_id=user_id,
            watched_percent=data.watched_percent,
        )
        db.add(reel_view)

        if data.watched_percent >= 50:
            reels.views_count += 1
    else:
        old_percent = reel_view.watched_percent

        if data.watched_percent > reel_view.watched_percent:
            reel_view.watched_percent = data.watched_percent

        if old_percent < 50 and reel_view.watched_percent >= 50:
            reels.views_count += 1

    db.commit()
    db.refresh(reels)

    return reels
