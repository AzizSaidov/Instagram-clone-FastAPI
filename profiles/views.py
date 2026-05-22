from fastapi import HTTPException
from sqlalchemy.orm import Session

from profiles.models import Profile
from profiles.schemas import ProfileUpdate


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


def get_profile_by_username(username: str, db: Session):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile
