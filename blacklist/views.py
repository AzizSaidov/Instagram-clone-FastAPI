from fastapi import HTTPException
from sqlalchemy.orm import Session

from blacklist.models import BlackList
from follows.models import Follow
from profiles.models import Profile


def get_profile_or_404(username: str, db: Session):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


def get_blacklist_data(blacklist: BlackList, profile: Profile):
    return {
        "id": blacklist.id,
        "created_at": blacklist.created_at,
        "blocked_user": profile
    }


def get_blacklist_response(blacklist: BlackList, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == blacklist.blocked_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Blocked user profile not found")

    return {
        "blacklist": get_blacklist_data(blacklist, profile)
    }


def block_user(username: str, db: Session, user_id: int):
    my_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if my_profile is None:
        raise HTTPException(status_code=404, detail="My profile not found")

    profile = get_profile_or_404(username, db)

    if profile.user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")

    existing_blacklist = db.query(BlackList).filter(
        BlackList.blocker_id == user_id,
        BlackList.blocked_id == profile.user_id
    ).first()

    if existing_blacklist:
        raise HTTPException(status_code=400, detail="User already blocked")

    new_blacklist = BlackList(
        blocker_id=user_id,
        blocked_id=profile.user_id
    )

    follows = db.query(Follow).filter(
        ((Follow.follower_id == user_id) & (Follow.following_id == profile.user_id)) |
        ((Follow.follower_id == profile.user_id) & (Follow.following_id == user_id))
    ).all()

    for follow in follows:
        db.delete(follow)

    db.add(new_blacklist)
    db.commit()
    db.refresh(new_blacklist)

    return get_blacklist_response(new_blacklist, db)


def unblock_user(username: str, db: Session, user_id: int):
    profile = get_profile_or_404(username, db)

    blacklist = db.query(BlackList).filter(
        BlackList.blocker_id == user_id,
        BlackList.blocked_id == profile.user_id
    ).first()

    if blacklist is None:
        raise HTTPException(status_code=404, detail="Blocked user not found")

    db.delete(blacklist)
    db.commit()

    return {"message": "User unblocked successfully"}


def get_blocked_users(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    blacklists = db.query(BlackList).filter(
        BlackList.blocker_id == user_id
    ).order_by(BlackList.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(blacklists) > limit
    blacklists = blacklists[:limit]

    user_ids = [blacklist.blocked_id for blacklist in blacklists]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    users = []
    for blacklist in blacklists:
        profile = profiles_by_user_id.get(blacklist.blocked_id)

        if profile:
            users.append(profile)

    return {
        "users": users,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }
