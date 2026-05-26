from fastapi import HTTPException
from sqlalchemy.orm import Session

from comments.models import Comment
from follows.models import Follow
from likes.models import Like
from profiles.models import Profile
from reels.models import Reel, ReelView
from reels.schemas import ReelCreate, ReelWatchUpdate
from users.permissions import can_view_content


def get_reel_counts(reels_id: int, db: Session):
    return {
        "likes_count": db.query(Like).filter(Like.reels_id == reels_id).count(),
        "comments_count": db.query(Comment).filter(Comment.reels_id == reels_id).count(),
    }


def is_reel_liked(reels_id: int, db: Session, user_id: int):
    return db.query(Like).filter(
        Like.reels_id == reels_id,
        Like.user_id == user_id,
    ).first() is not None


def get_reel_user_data(reel: Reel):
    profile = reel.user.profile if reel.user else None

    return {
        "id": reel.user_id,
        "username": profile.username if profile else "",
        "avatar_url": profile.avatar_url if profile else None,
    }


def get_reel_data(reel: Reel, db: Session, current_user_id: int):
    counts = get_reel_counts(reel.id, db)

    return {
        "id": reel.id,
        "user_id": reel.user_id,
        "video_url": reel.video_url,
        "description": reel.description,
        "hashtag": reel.hashtag,
        "views_count": reel.views_count,
        "likes_count": counts["likes_count"],
        "comments_count": counts["comments_count"],
        "is_liked": is_reel_liked(reel.id, db, current_user_id),
        "created_at": reel.created_at,
        "user": get_reel_user_data(reel),
    }


def get_reels_list_response(reels: list[Reel], db: Session, current_user_id: int, limit: int, offset: int, has_next: bool):
    return {
        "reels": [get_reel_data(reel, db, current_user_id) for reel in reels],
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def get_following_ids(db: Session, user_id: int):
    return [
        following_id
        for (following_id,) in db.query(Follow.following_id).filter(
            Follow.follower_id == user_id,
            Follow.is_accepted == True,
        ).all()
    ]


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

    return get_reel_data(new_reel, db, user_id)


def get_reel(reels_id: int, db: Session, current_user_id: int):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, current_user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this reels")

    return get_reel_data(reels, db, current_user_id)


def get_user_reels(db: Session, user_id: int, limit: int = 20, offset: int = 0, current_user_id: int | None = None):
    current_user_id = current_user_id or user_id
    reels = db.query(Reel).filter(Reel.user_id == user_id).order_by(Reel.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(reels) > limit
    reels = reels[:limit]

    return get_reels_list_response(reels, db, current_user_id, limit, offset, has_next)


def get_feed_reels(db: Session, user_id: int, limit: int = 10, offset: int = 0):
    feed_user_ids = get_following_ids(db, user_id)
    feed_user_ids.append(user_id)

    reels = db.query(Reel).filter(
        Reel.user_id.in_(feed_user_ids),
    ).order_by(Reel.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(reels) > limit
    reels = reels[:limit]

    return get_reels_list_response(reels, db, user_id, limit, offset, has_next)


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

    return get_reel_data(reels, db, user_id)


def get_reel_viewers(reels_id: int, db: Session, user_id: int, limit: int = 50, offset: int = 0):
    reel = db.query(Reel).filter(Reel.id == reels_id).first()

    if reel is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if reel.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can view only your reels viewers")

    profiles = db.query(Profile).join(
        ReelView,
        ReelView.user_id == Profile.user_id,
    ).filter(
        ReelView.reels_id == reels_id,
    ).order_by(ReelView.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(profiles) > limit
    profiles = profiles[:limit]

    return {
        "users": profiles,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def delete_reel(reels_id: int, db: Session, user_id: int):
    reel = db.query(Reel).filter(Reel.id == reels_id).first()

    if reel is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if reel.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can delete only your reels")

    comment_ids = [
        comment_id
        for (comment_id,) in db.query(Comment.id).filter(Comment.reels_id == reels_id).all()
    ]

    if comment_ids:
        db.query(Like).filter(Like.comment_id.in_(comment_ids)).delete(synchronize_session=False)

    db.query(Like).filter(Like.reels_id == reels_id).delete(synchronize_session=False)
    db.query(Comment).filter(Comment.reels_id == reels_id).delete(synchronize_session=False)
    db.query(ReelView).filter(ReelView.reels_id == reels_id).delete(synchronize_session=False)

    db.delete(reel)
    db.commit()
