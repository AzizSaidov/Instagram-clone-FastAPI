from fastapi import HTTPException
from sqlalchemy.orm import Session

from follows.models import Follow
from notifications.views import create_notification
from profiles.models import Profile
from users.permissions import can_view_content, is_blocked


def get_profile_or_404(username: str, db: Session):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


def get_follow_response(follow: Follow, db: Session):
    follower_profile = db.query(Profile).filter(Profile.user_id == follow.follower_id).first()
    following_profile = db.query(Profile).filter(Profile.user_id == follow.following_id).first()

    return {
        "follow": {
            "id": follow.id,
            "is_accepted": follow.is_accepted,
            "created_at": follow.created_at,
            "follower": follower_profile,
            "following": following_profile
        }
    }


def follow_user(username: str, db: Session, user_id: int):
    my_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if my_profile is None:
        raise HTTPException(status_code=404, detail="My profile not found")

    profile = get_profile_or_404(username, db)

    if profile.user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    if is_blocked(db, user_id, profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot follow this user")

    existing_follow = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == profile.user_id
    ).first()

    if existing_follow:
        if existing_follow.is_accepted:
            raise HTTPException(status_code=400, detail="Already following this user")

        raise HTTPException(status_code=400, detail="Follow request already sent")

    new_follow = Follow(
        follower_id=user_id,
        following_id=profile.user_id,
        is_accepted=not profile.is_private
    )

    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)

    notification_type = "follow"
    if profile.is_private:
        notification_type = "follow_request"

    create_notification(
        to_user_id=profile.user_id,
        from_user_id=user_id,
        notification_type=notification_type,
        db=db
    )

    return get_follow_response(new_follow, db)


def unfollow_user(username: str, db: Session, user_id: int):
    profile = get_profile_or_404(username, db)

    follow = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == profile.user_id
    ).first()

    if follow is None:
        raise HTTPException(status_code=404, detail="Follow not found")

    db.delete(follow)
    db.commit()

    return {"message": "Unfollowed successfully"}


def accept_follow_request(username: str, db: Session, user_id: int):
    follower_profile = get_profile_or_404(username, db)

    follow = db.query(Follow).filter(
        Follow.follower_id == follower_profile.user_id,
        Follow.following_id == user_id
    ).first()

    if follow is None:
        raise HTTPException(status_code=404, detail="Follow request not found")

    if is_blocked(db, user_id, follower_profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot accept this follow request")

    if follow.is_accepted:
        raise HTTPException(status_code=400, detail="Follow request already accepted")

    follow.is_accepted = True

    db.commit()
    db.refresh(follow)

    return get_follow_response(follow, db)


def reject_follow_request(username: str, db: Session, user_id: int):
    follower_profile = get_profile_or_404(username, db)

    follow = db.query(Follow).filter(
        Follow.follower_id == follower_profile.user_id,
        Follow.following_id == user_id,
        Follow.is_accepted == False
    ).first()

    if follow is None:
        raise HTTPException(status_code=404, detail="Follow request not found")

    db.delete(follow)
    db.commit()

    return {"message": "Follow request rejected"}


def get_followers(username: str, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    profile = get_profile_or_404(username, db)

    if not can_view_content(db, user_id, profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot view followers")

    follows = db.query(Follow).filter(
        Follow.following_id == profile.user_id,
        Follow.is_accepted == True
    ).order_by(Follow.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(follows) > limit
    follows = follows[:limit]

    user_ids = [follow.follower_id for follow in follows]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    users = []
    for follow in follows:
        follower_profile = profiles_by_user_id.get(follow.follower_id)

        if follower_profile:
            users.append(follower_profile)

    return {
        "users": users,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def get_following(username: str, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    profile = get_profile_or_404(username, db)

    if not can_view_content(db, user_id, profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot view following")

    follows = db.query(Follow).filter(
        Follow.follower_id == profile.user_id,
        Follow.is_accepted == True
    ).order_by(Follow.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(follows) > limit
    follows = follows[:limit]

    user_ids = [follow.following_id for follow in follows]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    users = []
    for follow in follows:
        following_profile = profiles_by_user_id.get(follow.following_id)

        if following_profile:
            users.append(following_profile)

    return {
        "users": users,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def get_follow_requests(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    follows = db.query(Follow).filter(
        Follow.following_id == user_id,
        Follow.is_accepted == False
    ).order_by(Follow.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(follows) > limit
    follows = follows[:limit]

    user_ids = [follow.follower_id for follow in follows]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    users = []
    for follow in follows:
        follower_profile = profiles_by_user_id.get(follow.follower_id)

        if follower_profile:
            users.append(follower_profile)

    return {
        "users": users,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }
