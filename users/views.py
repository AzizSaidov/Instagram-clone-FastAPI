from fastapi import HTTPException
from sqlalchemy.orm import Session

from profiles.models import Profile
from users.auth import create_access_token, hash_password, verify_password
from users.models import User
from users.schemas import LoginSchema, UserCreate


def register_user(data: UserCreate, db: Session):
    existing_user = db.query(User).filter(User.phone_number == data.phone_number).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already exists")

    existing_profile = db.query(Profile).filter(Profile.username == data.username).first()

    if existing_profile:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        phone_number=data.phone_number,
        hashed_password=hash_password(data.password),
    )

    db.add(new_user)
    db.flush()

    new_profile = Profile(
        user_id=new_user.id,
        username=data.username,
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_user)
    db.refresh(new_profile)

    new_user.profile = new_profile

    return {
        "user": new_user
    }


def login_user(data: LoginSchema, db: Session):
    user = db.query(User).filter(User.phone_number == data.login).first()

    if user is None:
        profile = db.query(Profile).filter(Profile.username == data.login).first()

        if profile:
            user = db.query(User).filter(User.id == profile.user_id).first()

    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid login or password")

    access_token = create_access_token(data={"user_id": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


def get_me(
    current_user: User,
):
    return {
        "user": current_user
    }
