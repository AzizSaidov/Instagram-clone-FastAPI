from fastapi import HTTPException
from sqlalchemy.orm import Session

from comments.models import Comment
from likes.models import Like
from notifications.views import create_notification
from posts.models import Post
from profiles.models import Profile
from reels.models import Reel
from users.permissions import can_view_content


def get_like_data(like: Like, profile: Profile):
    return {
        "id": like.id,
        "post_id": like.post_id,
        "comment_id": like.comment_id,
        "reels_id": like.reels_id,
        "created_at": like.created_at,
        "user": profile
    }


def get_toggle_like_response(like: Like, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == like.user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Like author profile not found")

    return {
        "is_liked": True,
        "like": get_like_data(like, profile)
    }


def get_likes_list_response(likes: list[Like], db: Session, limit: int, offset: int, has_next: bool):
    user_ids = [like.user_id for like in likes]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    likes_data = []
    for like in likes:
        profile = profiles_by_user_id.get(like.user_id)

        if profile:
            likes_data.append(get_like_data(like, profile))

    return {
        "likes": likes_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def check_comment_content_access(comment: Comment, db: Session, user_id: int):
    if comment.post_id is not None:
        post = db.query(Post).filter(Post.id == comment.post_id).first()

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        if not can_view_content(db, user_id, post.user_id):
            raise HTTPException(status_code=403, detail="You cannot view this comment")

    if comment.reels_id is not None:
        reels = db.query(Reel).filter(Reel.id == comment.reels_id).first()

        if reels is None:
            raise HTTPException(status_code=404, detail="Reels not found")

        if not can_view_content(db, user_id, reels.user_id):
            raise HTTPException(status_code=403, detail="You cannot view this comment")


def toggle_post_like(post_id: int, db: Session, user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot like this post")

    existing_like = db.query(Like).filter(
        Like.user_id == user_id,
        Like.post_id == post_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()

        return {
            "is_liked": False,
            "like": None
        }

    new_like = Like(
        user_id=user_id,
        post_id=post_id
    )

    db.add(new_like)
    db.commit()
    db.refresh(new_like)

    create_notification(
        to_user_id=post.user_id,
        from_user_id=user_id,
        notification_type="like",
        db=db,
        post_id=post_id
    )

    return get_toggle_like_response(new_like, db)


def get_post_likes(post_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot view these likes")

    likes = db.query(Like).filter(Like.post_id == post_id).order_by(Like.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(likes) > limit
    likes = likes[:limit]

    return get_likes_list_response(likes, db, limit, offset, has_next)


def toggle_reels_like(reels_id: int, db: Session, user_id: int):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot like this reels")

    existing_like = db.query(Like).filter(
        Like.user_id == user_id,
        Like.reels_id == reels_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()

        return {
            "is_liked": False,
            "like": None
        }

    new_like = Like(
        user_id=user_id,
        reels_id=reels_id
    )

    db.add(new_like)
    db.commit()
    db.refresh(new_like)

    create_notification(
        to_user_id=reels.user_id,
        from_user_id=user_id,
        notification_type="like",
        db=db,
        reels_id=reels_id
    )

    return get_toggle_like_response(new_like, db)


def get_reels_likes(reels_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot view these likes")

    likes = db.query(Like).filter(Like.reels_id == reels_id).order_by(Like.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(likes) > limit
    likes = likes[:limit]

    return get_likes_list_response(likes, db, limit, offset, has_next)


def toggle_comment_like(comment_id: int, db: Session, user_id: int):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    check_comment_content_access(comment, db, user_id)

    existing_like = db.query(Like).filter(
        Like.user_id == user_id,
        Like.comment_id == comment_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()

        return {
            "is_liked": False,
            "like": None
        }

    new_like = Like(
        user_id=user_id,
        comment_id=comment_id
    )

    db.add(new_like)
    db.commit()
    db.refresh(new_like)

    create_notification(
        to_user_id=comment.user_id,
        from_user_id=user_id,
        notification_type="like",
        db=db,
        comment_id=comment_id
    )

    return get_toggle_like_response(new_like, db)


def get_comment_likes(comment_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    check_comment_content_access(comment, db, user_id)

    likes = db.query(Like).filter(Like.comment_id == comment_id).order_by(Like.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(likes) > limit
    likes = likes[:limit]

    return get_likes_list_response(likes, db, limit, offset, has_next)
