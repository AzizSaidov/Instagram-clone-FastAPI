from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from profiles.schemas import ProfileRead, ProfileUpdate
from profiles.views import get_my_profile, get_profile_by_username, update_my_profile
from users.auth import get_current_user
from users.models import User


profiles_router = APIRouter(prefix="/profiles", tags=["Profiles"])


@profiles_router.get("/me/", response_model=ProfileRead)
def my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_profile(db, current_user.id)


@profiles_router.put("/me/", response_model=ProfileRead)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_my_profile(data, db, current_user.id)


@profiles_router.get("/{username}/", response_model=ProfileRead)
def profile_by_username(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_profile_by_username(username, db)
