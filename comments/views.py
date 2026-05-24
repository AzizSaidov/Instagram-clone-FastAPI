from fastapi import HTTPException
from sqlalchemy.orm import Session

from comments.models import Comment
from comments.schemas import CommentCreate, CommentUpdate
from notifications.views import create_notification
from posts.models import Post
from profiles.models import Profile
from reels.models import Reel
from users.permissions import can_view_content


def get_comment_or_404(comment_id: int, db: Session):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    return comment


def get_comment_data(comment: Comment, profile: Profile):
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "reels_id": comment.reels_id,
        "text": comment.text,
        "created_at": comment.created_at,
        "user": profile
    }


def get_comment_response(comment: Comment, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == comment.user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Comment author profile not found")

    return {
        "comment": get_comment_data(comment, profile)
    }


def get_comments_list_response(comments: list[Comment], db: Session, limit: int, offset: int, has_next: bool):
    user_ids = [comment.user_id for comment in comments]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    comments_data = []
    for comment in comments:
        profile = profiles_by_user_id.get(comment.user_id)

        if profile:
            comments_data.append(get_comment_data(comment, profile))

    return {
        "comments": comments_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def create_post_comment(post_id: int, data: CommentCreate, db: Session, user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot comment this post")

    new_comment = Comment(
        user_id=user_id,
        post_id=post_id,
        text=data.text
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    create_notification(
        to_user_id=post.user_id,
        from_user_id=user_id,
        notification_type="comment",
        db=db,
        post_id=post_id
    )

    return get_comment_response(new_comment, db)


def create_reel_comment(reels_id: int, data: CommentCreate, db: Session, user_id: int):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot comment this reels")

    new_comment = Comment(
        user_id=user_id,
        reels_id=reels_id,
        text=data.text
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    create_notification(
        to_user_id=reels.user_id,
        from_user_id=user_id,
        notification_type="comment",
        db=db,
        reels_id=reels_id
    )

    return get_comment_response(new_comment, db)


def get_post_comments(post_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot view these comments")

    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(comments) > limit
    comments = comments[:limit]

    return get_comments_list_response(comments, db, limit, offset, has_next)


def get_reel_comments(reels_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    reels = db.query(Reel).filter(Reel.id == reels_id).first()

    if reels is None:
        raise HTTPException(status_code=404, detail="Reels not found")

    if not can_view_content(db, user_id, reels.user_id):
        raise HTTPException(status_code=403, detail="You cannot view these comments")

    comments = db.query(Comment).filter(Comment.reels_id == reels_id).order_by(Comment.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(comments) > limit
    comments = comments[:limit]

    return get_comments_list_response(comments, db, limit, offset, has_next)


def update_comment(comment_id: int, data: CommentUpdate, db: Session, user_id: int):
    comment = get_comment_or_404(comment_id, db)

    if comment.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can update only your comment")

    comment.text = data.text

    db.commit()
    db.refresh(comment)

    return get_comment_response(comment, db)


def delete_comment(comment_id: int, db: Session, user_id: int):
    comment = get_comment_or_404(comment_id, db)

    can_delete = comment.user_id == user_id

    if comment.post_id is not None:
        post = db.query(Post).filter(Post.id == comment.post_id).first()

        if post and post.user_id == user_id:
            can_delete = True

    if comment.reels_id is not None:
        reels = db.query(Reel).filter(Reel.id == comment.reels_id).first()

        if reels and reels.user_id == user_id:
            can_delete = True

    if not can_delete:
        raise HTTPException(status_code=403, detail="You cannot delete this comment")

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}
