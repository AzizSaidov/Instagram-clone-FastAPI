from fastapi import HTTPException
from sqlalchemy.orm import Session

from posts.models import Post
from posts.views import get_post_data
from reels.models import Reel
from reels.views import get_reel_data
from saved.models import SavedPost, SavedReel
from users.permissions import can_view_content


def toggle_saved_post(post_id: int, db: Session, user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot save this post")

    saved_post = db.query(SavedPost).filter(
        SavedPost.user_id == user_id,
        SavedPost.post_id == post_id,
    ).first()

    if saved_post:
        db.delete(saved_post)
        db.commit()

        return {
            "is_saved": False,
            "message": "Post removed from saved",
        }

    new_saved_post = SavedPost(
        user_id=user_id,
        post_id=post_id,
    )

    db.add(new_saved_post)
    db.commit()

    return {
        "is_saved": True,
        "message": "Post saved",
    }


def get_saved_posts(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    saved_posts = db.query(SavedPost).filter(
        SavedPost.user_id == user_id,
    ).order_by(SavedPost.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(saved_posts) > limit
    saved_posts = saved_posts[:limit]

    saved_posts_data = []
    for saved_post in saved_posts:
        if saved_post.post is None:
            continue

        if not can_view_content(db, user_id, saved_post.post.user_id):
            continue

        saved_posts_data.append(
            {
                "id": saved_post.id,
                "post_id": saved_post.post_id,
                "created_at": saved_post.created_at,
                "post": get_post_data(saved_post.post, db, user_id),
            }
        )

    return {
        "saved_posts": saved_posts_data,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "has_next": has_next,
        },
    }


def delete_saved_post(post_id: int, db: Session, user_id: int):
    saved_post = db.query(SavedPost).filter(
        SavedPost.user_id == user_id,
        SavedPost.post_id == post_id,
    ).first()

    if saved_post is None:
        raise HTTPException(status_code=404, detail="Saved post not found")

    db.delete(saved_post)
    db.commit()


def toggle_saved_reel(reels_id: int, db: Session, user_id: int):
    reel = db.query(Reel).filter(Reel.id == reels_id).first()

    if reel is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, user_id, reel.user_id):
        raise HTTPException(status_code=403, detail="You cannot save this reels")

    saved_reel = db.query(SavedReel).filter(
        SavedReel.user_id == user_id,
        SavedReel.reels_id == reels_id,
    ).first()

    if saved_reel:
        db.delete(saved_reel)
        db.commit()

        return {
            "is_saved": False,
            "message": "Reels removed from saved",
        }

    new_saved_reel = SavedReel(
        user_id=user_id,
        reels_id=reels_id,
    )

    db.add(new_saved_reel)
    db.commit()

    return {
        "is_saved": True,
        "message": "Reels saved",
    }


def get_saved_reels(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    saved_reels = db.query(SavedReel).filter(
        SavedReel.user_id == user_id,
    ).order_by(SavedReel.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(saved_reels) > limit
    saved_reels = saved_reels[:limit]

    saved_reels_data = []
    for saved_reel in saved_reels:
        if saved_reel.reel is None:
            continue

        if not can_view_content(db, user_id, saved_reel.reel.user_id):
            continue

        saved_reels_data.append(
            {
                "id": saved_reel.id,
                "reels_id": saved_reel.reels_id,
                "created_at": saved_reel.created_at,
                "reel": get_reel_data(saved_reel.reel, db, user_id),
            }
        )

    return {
        "saved_reels": saved_reels_data,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "has_next": has_next,
        },
    }


def delete_saved_reel(reels_id: int, db: Session, user_id: int):
    saved_reel = db.query(SavedReel).filter(
        SavedReel.user_id == user_id,
        SavedReel.reels_id == reels_id,
    ).first()

    if saved_reel is None:
        raise HTTPException(status_code=404, detail="Saved reels not found")

    db.delete(saved_reel)
    db.commit()
