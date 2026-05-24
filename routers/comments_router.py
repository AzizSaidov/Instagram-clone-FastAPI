from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from comments.schemas import CommentCreate, CommentResponse, CommentsListResponse, CommentUpdate
from comments.views import (
    create_post_comment,
    create_reel_comment,
    delete_comment,
    get_post_comments,
    get_reel_comments,
    update_comment,
)
from database import get_db
from users.auth import get_current_user
from users.models import User


comments_router = APIRouter(prefix="/comments", tags=["Comments"])


@comments_router.post("/posts/{post_id}/", response_model=CommentResponse, status_code=201)
def add_post_comment(post_id: int, data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_post_comment(post_id, data, db, current_user.id)


@comments_router.post("/reels/{reels_id}/", response_model=CommentResponse, status_code=201)
def add_reels_comment(reels_id: int, data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_reel_comment(reels_id, data, db, current_user.id)


@comments_router.get("/posts/{post_id}/", response_model=CommentsListResponse)
def post_comments(post_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_post_comments(post_id, db, current_user.id, limit, offset)


@comments_router.get("/reels/{reels_id}/", response_model=CommentsListResponse)
def reels_comments(reels_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_reel_comments(reels_id, db, current_user.id, limit, offset)


@comments_router.put("/{comment_id}/", response_model=CommentResponse)
def update_my_comment(comment_id: int, data: CommentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_comment(comment_id, data, db, current_user.id)


@comments_router.delete("/{comment_id}/")
def delete_my_comment(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_comment(comment_id, db, current_user.id)
