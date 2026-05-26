from fastapi import HTTPException
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from blacklist.models import BlackList
from comments.models import Comment
from follows.models import Follow
from likes.models import Like
from posts.models import Post, PostMedia, PostView
from posts.schemas import PostCreate
from profiles.models import Profile
from saved.models import SavedPost
from users.permissions import can_view_content


def get_post_counts(post_id: int, db: Session):
    return {
        "likes_count": db.query(Like).filter(Like.post_id == post_id).count(),
        "comments_count": db.query(Comment).filter(Comment.post_id == post_id).count(),
    }


def is_post_liked(post_id: int, db: Session, user_id: int):
    return db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id,
    ).first() is not None


def is_post_saved(post_id: int, db: Session, user_id: int):
    return db.query(SavedPost).filter(
        SavedPost.post_id == post_id,
        SavedPost.user_id == user_id,
    ).first() is not None


def get_post_user_data(post: Post):
    profile = post.user.profile if post.user else None

    return {
        "id": post.user_id,
        "username": profile.username if profile else "",
        "avatar_url": profile.avatar_url if profile else None,
    }


def get_post_data(post: Post, db: Session, current_user_id: int):
    counts = get_post_counts(post.id, db)

    return {
        "id": post.id,
        "user_id": post.user_id,
        "description": post.description,
        "hashtag": post.hashtag,
        "views_count": post.views_count,
        "likes_count": counts["likes_count"],
        "comments_count": counts["comments_count"],
        "is_liked": is_post_liked(post.id, db, current_user_id),
        "is_saved": is_post_saved(post.id, db, current_user_id),
        "created_at": post.created_at,
        "media": sorted(post.media, key=lambda media: media.order_index),
        "user": get_post_user_data(post),
    }


def get_posts_list_response(posts: list[Post], db: Session, current_user_id: int, limit: int, offset: int, has_next: bool):
    return {
        "posts": [get_post_data(post, db, current_user_id) for post in posts],
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


def get_blocked_user_ids(db: Session, user_id: int):
    blocked_rows = db.query(BlackList).filter(
        (BlackList.blocker_id == user_id) |
        (BlackList.blocked_id == user_id),
    ).all()

    blocked_user_ids = []

    for blocked_row in blocked_rows:
        if blocked_row.blocker_id == user_id:
            blocked_user_ids.append(blocked_row.blocked_id)
        else:
            blocked_user_ids.append(blocked_row.blocker_id)

    return blocked_user_ids


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

    return get_post_data(new_post, db, user_id)


def get_post(post_id: int, db: Session, current_user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, current_user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this post")

    return get_post_data(post, db, current_user_id)


def get_user_posts(db: Session, user_id: int, limit: int = 20, offset: int = 0, current_user_id: int | None = None):
    current_user_id = current_user_id or user_id
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(posts) > limit
    posts = posts[:limit]

    return get_posts_list_response(posts, db, current_user_id, limit, offset, has_next)


def get_feed_posts(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    feed_user_ids = get_following_ids(db, user_id)
    feed_user_ids.append(user_id)

    posts = db.query(Post).filter(
        Post.user_id.in_(feed_user_ids),
    ).order_by(Post.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(posts) > limit
    posts = posts[:limit]

    return get_posts_list_response(posts, db, user_id, limit, offset, has_next)


def get_explore_posts(db: Session, user_id: int, limit: int = 24, offset: int = 0):
    feed_user_ids = set(get_following_ids(db, user_id))
    feed_user_ids.add(user_id)
    blocked_user_ids = get_blocked_user_ids(db, user_id)

    likes_subquery = db.query(
        Like.post_id.label("post_id"),
        func.count(Like.id).label("likes_count"),
    ).filter(Like.post_id.isnot(None)).group_by(Like.post_id).subquery()

    comments_subquery = db.query(
        Comment.post_id.label("post_id"),
        func.count(Comment.id).label("comments_count"),
    ).filter(Comment.post_id.isnot(None)).group_by(Comment.post_id).subquery()

    query = db.query(Post).join(
        Profile,
        Profile.user_id == Post.user_id,
    ).filter(Profile.is_private == False).outerjoin(
        likes_subquery,
        likes_subquery.c.post_id == Post.id,
    ).outerjoin(
        comments_subquery,
        comments_subquery.c.post_id == Post.id,
    )

    if feed_user_ids:
        query = query.filter(Post.user_id.notin_(feed_user_ids))

    if blocked_user_ids:
        query = query.filter(Post.user_id.notin_(blocked_user_ids))

    posts = query.order_by(
        desc(
            Post.views_count +
            func.coalesce(likes_subquery.c.likes_count, 0) * 3 +
            func.coalesce(comments_subquery.c.comments_count, 0) * 2,
        ),
        Post.created_at.desc(),
    ).offset(offset).limit(limit + 1).all()

    has_next = len(posts) > limit
    posts = posts[:limit]

    return get_posts_list_response(
        posts,
        db,
        user_id,
        limit,
        offset,
        has_next,
    )


def create_post_view(post_id: int, db: Session, user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if not can_view_content(db, user_id, post.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this post")

    existing_view = db.query(PostView).filter(PostView.post_id == post_id, PostView.user_id == user_id).first()

    if existing_view:
        return get_post_data(post, db, user_id)

    new_view = PostView(
        post_id=post_id,
        user_id=user_id,
    )

    post.views_count += 1

    db.add(new_view)
    db.commit()
    db.refresh(post)

    return get_post_data(post, db, user_id)


def get_post_viewers(post_id: int, db: Session, user_id: int, limit: int = 50, offset: int = 0):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can view only your post viewers")

    profiles = db.query(Profile).join(
        PostView,
        PostView.user_id == Profile.user_id,
    ).filter(
        PostView.post_id == post_id,
    ).order_by(PostView.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(profiles) > limit
    profiles = profiles[:limit]

    return {
        "users": profiles,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def delete_post(post_id: int, db: Session, user_id: int):
    post = db.query(Post).filter(Post.id == post_id).first()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can delete only your post")

    comment_ids = [
        comment_id
        for (comment_id,) in db.query(Comment.id).filter(Comment.post_id == post_id).all()
    ]

    if comment_ids:
        db.query(Like).filter(Like.comment_id.in_(comment_ids)).delete(synchronize_session=False)

    db.query(SavedPost).filter(SavedPost.post_id == post_id).delete(synchronize_session=False)
    db.query(Like).filter(Like.post_id == post_id).delete(synchronize_session=False)
    db.query(Comment).filter(Comment.post_id == post_id).delete(synchronize_session=False)
    db.query(PostView).filter(PostView.post_id == post_id).delete(synchronize_session=False)
    db.query(PostMedia).filter(PostMedia.post_id == post_id).delete(synchronize_session=False)

    db.delete(post)
    db.commit()
