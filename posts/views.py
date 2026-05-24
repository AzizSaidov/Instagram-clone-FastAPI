from fastapi import HTTPException
from sqlalchemy.orm import Session

from posts.models import Post, PostMedia, PostView
from posts.schemas import PostCreate
from users.permissions import can_view_content


def create_post(data: PostCreate, db: Session, user_id: int):
    new_post = Post(
        user_id=user_id,
        description=data.description,
        hashtag=data.hashtag,
    )

    db.add(new_post)
    db.flush()

    for media_item in data.media:
        new_media = PostMedia(
            post_id=new_post.id,
            media_url=media_item.media_url,
            order_index=media_item.order_index,
        )
        db.add(new_media)

    db.commit()
    db.refresh(new_post)

    return new_post


def get_post(post_id: int, db: Session, current_user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, current_user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this post")

    return post


def get_user_posts(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(posts) > limit
    posts = posts[:limit]

    return {
        "posts": posts,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def create_post_view(post_id: int, db: Session, user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this post")

    existing_view = db.query(PostView).filter(PostView.post_id == post_id, PostView.user_id == user_id).first()

    if existing_view:
        return post

    new_view = PostView(
        post_id=post_id,
        user_id=user_id,
    )

    post.views_count += 1

    db.add(new_view)
    db.commit()
    db.refresh(post)

    return post
