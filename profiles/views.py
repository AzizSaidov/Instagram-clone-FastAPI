from fastapi import HTTPException
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from follows.models import Follow
from blacklist.models import BlackList
from likes.models import Like
from posts.models import Post
from posts.views import get_post_data
from profiles.models import Profile
from profiles.schemas import ProfileUpdate
from reels.models import Reel
from reels.views import get_reel_data
from users.permissions import can_view_content, can_view_profile


def get_blocked_user_ids(db: Session, user_id: int):
    blocked_users = db.query(BlackList).filter(
        (BlackList.blocker_id == user_id) |
        (BlackList.blocked_id == user_id)
    ).all()

    blocked_user_ids = []
    for blacklist in blocked_users:
        if blacklist.blocker_id == user_id:
            blocked_user_ids.append(blacklist.blocked_id)
        else:
            blocked_user_ids.append(blacklist.blocker_id)

    return blocked_user_ids


def get_follow_target_ids(db: Session, user_id: int):
    return [
        following_id
        for (following_id,) in db.query(Follow.following_id).filter(
            Follow.follower_id == user_id
        ).all()
    ]


def get_accepted_following_ids(db: Session, user_id: int):
    return [
        following_id
        for (following_id,) in db.query(Follow.following_id).filter(
            Follow.follower_id == user_id,
            Follow.is_accepted == True,
        ).all()
    ]


def get_my_profile(db: Session, user_id: int):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


def update_my_profile(data: ProfileUpdate, db: Session, user_id: int):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.username is not None:
        existing_profile = db.query(Profile).filter(Profile.username == data.username).first()

        if existing_profile and existing_profile.user_id != user_id:
            raise HTTPException(status_code=400, detail="Username already exists")

        profile.username = data.username

    if data.full_name is not None:
        profile.full_name = data.full_name

    if data.bio is not None:
        profile.bio = data.bio

    if data.avatar_url is not None:
        profile.avatar_url = data.avatar_url

    if data.is_private is not None:
        profile.is_private = data.is_private

    db.commit()
    db.refresh(profile)

    return profile


def delete_my_avatar(db: Session, user_id: int):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.avatar_url = None
    db.commit()
    db.refresh(profile)

    return profile


def get_profile_by_username(username: str, db: Session):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


def get_profile_page(username: str, db: Session, current_user_id: int, limit: int = 20, offset: int = 0):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    if not can_view_profile(db, current_user_id, profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this profile")

    posts_count = db.query(Post).filter(Post.user_id == profile.user_id).count()
    reels_count = db.query(Reel).filter(Reel.user_id == profile.user_id).count()

    followers_count = db.query(Follow).filter(
        Follow.following_id == profile.user_id,
        Follow.is_accepted == True
    ).count()

    following_count = db.query(Follow).filter(
        Follow.follower_id == profile.user_id,
        Follow.is_accepted == True
    ).count()

    follow = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == profile.user_id
    ).first()

    is_following = follow is not None and follow.is_accepted
    is_follow_requested = follow is not None and not follow.is_accepted

    posts = []
    reels = []
    posts_has_next = False
    reels_has_next = False

    if can_view_content(db, current_user_id, profile.user_id):
        posts = db.query(Post).filter(
            Post.user_id == profile.user_id
        ).order_by(Post.created_at.desc()).offset(offset).limit(limit + 1).all()

        reels = db.query(Reel).filter(
            Reel.user_id == profile.user_id
        ).order_by(Reel.created_at.desc()).offset(offset).limit(limit + 1).all()

        posts_has_next = len(posts) > limit
        reels_has_next = len(reels) > limit

        posts = posts[:limit]
        reels = reels[:limit]

    posts_data = [get_post_data(post, db, current_user_id) for post in posts]
    reels_data = [get_reel_data(reel, db, current_user_id) for reel in reels]

    return {
        "profile": {
            "id": profile.id,
            "username": profile.username,
            "full_name": profile.full_name,
            "bio": profile.bio,
            "avatar_url": profile.avatar_url,
            "is_private": profile.is_private,
            "is_following": is_following,
            "is_follow_requested": is_follow_requested,
            "posts_count": posts_count,
            "reels_count": reels_count,
            "followers_count": followers_count,
            "following_count": following_count,
        },
        "posts": posts_data,
        "reels": reels_data,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "has_next": posts_has_next or reels_has_next,
        }
    }


def search_profiles(query: str, db: Session, current_user_id: int, limit: int = 20, offset: int = 0):
    query = query.strip().lower()

    if not query:
        raise HTTPException(status_code=400, detail="Search query is required")

    blocked_user_ids = get_blocked_user_ids(db, current_user_id)
    profiles_query = db.query(Profile).filter(
        Profile.user_id != current_user_id,
        (
            Profile.username.ilike(f"%{query}%")
            | Profile.full_name.ilike(f"%{query}%")
        ),
    )

    if blocked_user_ids:
        profiles_query = profiles_query.filter(
            Profile.user_id.notin_(blocked_user_ids)
        )

    profiles = profiles_query.order_by(Profile.username.asc()).offset(offset).limit(limit + 1).all()

    has_next = len(profiles) > limit
    profiles = profiles[:limit]

    return {
        "users": profiles,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def get_profile_recommendations(db: Session, current_user_id: int, limit: int = 5, offset: int = 0):
    blocked_user_ids = get_blocked_user_ids(db, current_user_id)
    followed_user_ids = get_follow_target_ids(db, current_user_id)
    current_following_ids = get_accepted_following_ids(db, current_user_id)

    followers_subquery = db.query(
        Follow.following_id.label("user_id"),
        func.count(Follow.id).label("followers_count"),
    ).filter(Follow.is_accepted == True).group_by(Follow.following_id).subquery()

    mutual_subquery = db.query(
        Follow.follower_id.label("user_id"),
        func.count(Follow.following_id).label("mutual_count"),
    ).filter(
        Follow.is_accepted == True,
        Follow.following_id.in_(current_following_ids) if current_following_ids else False,
    ).group_by(Follow.follower_id).subquery()

    post_likes_subquery = db.query(
        Post.user_id.label("user_id"),
        func.count(Like.id).label("post_likes_count"),
    ).join(Like, Like.post_id == Post.id).group_by(Post.user_id).subquery()

    reel_likes_subquery = db.query(
        Reel.user_id.label("user_id"),
        func.count(Like.id).label("reel_likes_count"),
    ).join(Like, Like.reels_id == Reel.id).group_by(Reel.user_id).subquery()

    post_views_subquery = db.query(
        Post.user_id.label("user_id"),
        func.coalesce(func.sum(Post.views_count), 0).label("post_views_count"),
    ).group_by(Post.user_id).subquery()

    reel_views_subquery = db.query(
        Reel.user_id.label("user_id"),
        func.coalesce(func.sum(Reel.views_count), 0).label("reel_views_count"),
    ).group_by(Reel.user_id).subquery()

    query = db.query(Profile).outerjoin(
        followers_subquery,
        followers_subquery.c.user_id == Profile.user_id,
    ).outerjoin(
        mutual_subquery,
        mutual_subquery.c.user_id == Profile.user_id,
    ).outerjoin(
        post_likes_subquery,
        post_likes_subquery.c.user_id == Profile.user_id,
    ).outerjoin(
        reel_likes_subquery,
        reel_likes_subquery.c.user_id == Profile.user_id,
    ).outerjoin(
        post_views_subquery,
        post_views_subquery.c.user_id == Profile.user_id,
    ).outerjoin(
        reel_views_subquery,
        reel_views_subquery.c.user_id == Profile.user_id,
    ).filter(Profile.user_id != current_user_id)

    excluded_user_ids = set(blocked_user_ids + followed_user_ids)

    if excluded_user_ids:
        query = query.filter(Profile.user_id.notin_(excluded_user_ids))

    score = (
        func.coalesce(mutual_subquery.c.mutual_count, 0) * 50
        + func.coalesce(followers_subquery.c.followers_count, 0) * 8
        + func.coalesce(post_likes_subquery.c.post_likes_count, 0) * 3
        + func.coalesce(reel_likes_subquery.c.reel_likes_count, 0) * 3
        + func.coalesce(post_views_subquery.c.post_views_count, 0)
        + func.coalesce(reel_views_subquery.c.reel_views_count, 0)
        + case((Profile.is_private == True, -25), else_=0)
    )

    profiles = query.order_by(
        desc(score),
        desc(func.coalesce(mutual_subquery.c.mutual_count, 0)),
        desc(func.coalesce(followers_subquery.c.followers_count, 0)),
        Profile.username.asc(),
    ).offset(offset).limit(limit + 1).all()

    has_next = len(profiles) > limit
    profiles = profiles[:limit]

    return {
        "users": profiles,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }
