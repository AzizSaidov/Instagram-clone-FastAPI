from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from database import get_db
from saved.schemas import SavedPostsListResponse, ToggleSavedResponse
from saved.views import delete_saved_post, get_saved_posts, toggle_saved_post
from users.auth import get_current_user
from users.models import User


saved_router = APIRouter()


@saved_router.post("/{post_id}/", response_model=ToggleSavedResponse)
def toggle_post_saved(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_saved_post(post_id, db, current_user.id)


@saved_router.get("/", response_model=SavedPostsListResponse)
def my_saved_posts(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_saved_posts(db, current_user.id, limit, offset)


@saved_router.delete("/{post_id}/", status_code=204)
def remove_post_from_saved(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_saved_post(post_id, db, current_user.id)
    return Response(status_code=204)
