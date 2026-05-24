from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from profiles.schemas import MyProfileResponse, ProfilePageResponse, ProfileSearchResponse, ProfileUpdate
from profiles.views import get_my_profile, get_profile_page, search_profiles, update_my_profile
from users.auth import get_current_user
from users.models import User


profiles_router = APIRouter(prefix="/profiles", tags=["Profiles"])


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


@profiles_router.get("/search/", response_model=ProfileSearchResponse)
def profiles_search(query: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return search_profiles(query, db, current_user.id, limit, offset)


@profiles_router.get("/{username}/", response_model=ProfilePageResponse)
def profile_by_username(username: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_profile_page(username, db, current_user.id, limit, offset)
