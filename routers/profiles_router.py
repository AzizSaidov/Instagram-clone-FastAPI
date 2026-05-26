from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from profiles.schemas import MyProfileResponse, ProfilePageResponse, ProfileSearchResponse, ProfileUpdate
from profiles.views import delete_my_avatar, get_my_profile, get_profile_page, get_profile_recommendations, search_profiles, update_my_profile
from users.auth import get_current_user
from users.models import User


profiles_router = APIRouter(prefix="/profiles", tags=["Profiles"])

AVATARS_MEDIA_DIR = Path("media/avatars")
ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]


def save_avatar_file(file: UploadFile):
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=400, detail="Invalid avatar type")

    AVATARS_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    file_extension = Path(file.filename or "avatar.jpg").suffix or ".jpg"
    file_name = f"{uuid4()}{file_extension}"
    file_path = AVATARS_MEDIA_DIR / file_name

    with open(file_path, "wb") as avatar_file:
        avatar_file.write(file.file.read())

    return f"/media/avatars/{file_name}"


@profiles_router.get("/me/", response_model=MyProfileResponse)
def my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.profile = get_my_profile(db, current_user.id)

    return {
        "user": current_user
    }


@profiles_router.put("/me/", response_model=MyProfileResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.profile = update_my_profile(data, db, current_user.id)

    return {
        "user": current_user
    }


@profiles_router.post("/me/avatar/", response_model=MyProfileResponse)
def upload_my_avatar(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    avatar_url = save_avatar_file(file)
    current_user.profile = update_my_profile(ProfileUpdate(avatar_url=avatar_url), db, current_user.id)

    return {
        "user": current_user
    }


@profiles_router.delete("/me/avatar/", response_model=MyProfileResponse)
def remove_my_avatar(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.profile = delete_my_avatar(db, current_user.id)

    return {
        "user": current_user
    }


@profiles_router.get("/search/", response_model=ProfileSearchResponse)
def profiles_search(query: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return search_profiles(query, db, current_user.id, limit, offset)


@profiles_router.get("/recommendations/", response_model=ProfileSearchResponse)
def profiles_recommendations(limit: int = 5, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_profile_recommendations(db, current_user.id, limit, offset)


@profiles_router.get("/{username}/", response_model=ProfilePageResponse)
def profile_by_username(username: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_profile_page(username, db, current_user.id, limit, offset)
