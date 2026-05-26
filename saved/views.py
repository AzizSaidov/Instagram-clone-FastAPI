from fastapi import HTTPException
from sqlalchemy.orm import Session

from posts.models import Post
from posts.views import get_post_data
from saved.models import SavedPost
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
