from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from follows.schemas import FollowResponse, FollowsListResponse
from follows.views import (
    accept_follow_request,
    follow_user,
    get_follow_requests,
    get_followers,
    get_following,
    reject_follow_request,
    unfollow_user,
)
from users.auth import get_current_user
from users.models import User


follows_router = APIRouter(prefix="/follows", tags=["Follows"])


@follows_router.get("/requests/", response_model=FollowsListResponse)
def follow_requests(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_follow_requests(db, current_user.id, limit, offset)


@follows_router.post("/requests/{username}/accept/", response_model=FollowResponse)
def accept_request(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return accept_follow_request(username, db, current_user.id)


@follows_router.delete("/requests/{username}/reject/")
def reject_request(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return reject_follow_request(username, db, current_user.id)


@follows_router.post("/{username}/", response_model=FollowResponse, status_code=201)
def follow(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return follow_user(username, db, current_user.id)


@follows_router.delete("/{username}/")
def unfollow(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return unfollow_user(username, db, current_user.id)


@follows_router.get("/{username}/followers/", response_model=FollowsListResponse)
def followers(username: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_followers(username, db, current_user.id, limit, offset)


@follows_router.get("/{username}/following/", response_model=FollowsListResponse)
def following(username: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_following(username, db, current_user.id, limit, offset)
