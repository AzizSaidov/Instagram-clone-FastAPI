from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from likes.schemas import LikesListResponse, ToggleLikeResponse
from likes.views import (
    get_comment_likes,
    get_post_likes,
    get_reels_likes,
    toggle_comment_like as toggle_comment_like_view,
    toggle_post_like as toggle_post_like_view,
    toggle_reels_like as toggle_reels_like_view,
)
from users.auth import get_current_user
from users.models import User


likes_router = APIRouter(prefix="/likes", tags=["Likes"])


@likes_router.post("/posts/{post_id}/", response_model=ToggleLikeResponse)
def toggle_post_like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_post_like_view(post_id, db, current_user.id)


@likes_router.get("/posts/{post_id}/", response_model=LikesListResponse)
def post_likes(post_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_post_likes(post_id, db, current_user.id, limit, offset)


@likes_router.post("/reels/{reels_id}/", response_model=ToggleLikeResponse)
def toggle_reels_like(reels_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_reels_like_view(reels_id, db, current_user.id)


@likes_router.get("/reels/{reels_id}/", response_model=LikesListResponse)
def reels_likes(reels_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_reels_likes(reels_id, db, current_user.id, limit, offset)


@likes_router.post("/comments/{comment_id}/", response_model=ToggleLikeResponse)
def toggle_comment_like(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_comment_like_view(comment_id, db, current_user.id)


@likes_router.get("/comments/{comment_id}/", response_model=LikesListResponse)
def comment_likes(comment_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_comment_likes(comment_id, db, current_user.id, limit, offset)
