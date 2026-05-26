from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from profiles.schemas import ProfileSearchResponse
from reels.schemas import ReelCreate, ReelResponse, ReelsListResponse, ReelWatchUpdate
from reels.views import create_reel, delete_reel, get_feed_reels, get_reel, get_reel_viewers, get_user_reels, update_reel_view
from users.auth import get_current_user
from users.models import User


reels_router = APIRouter(prefix="/reels", tags=["Reels"])

REELS_MEDIA_DIR = Path("media/reels")
ALLOWED_REELS_MEDIA_TYPES = ["video/mp4"]


def save_reels_file(file: UploadFile):
    if file.content_type not in ALLOWED_REELS_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid video type")

    file_extension = Path(file.filename).suffix
    file_name = f"{uuid4()}{file_extension}"
    file_path = REELS_MEDIA_DIR / file_name

    with open(file_path, "wb") as media_file:
        media_file.write(file.file.read())

    return f"/media/reels/{file_name}"


@reels_router.post("/", response_model=ReelResponse, status_code=201)
def create_my_reels(
    description: str | None = Form(default=None),
    hashtag: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video_url = save_reels_file(file)

    data = ReelCreate(
        video_url=video_url,
        description=description,
        hashtag=hashtag,
    )

    return {
        "reel": create_reel(data, db, current_user.id)
    }


@reels_router.get("/my/", response_model=ReelsListResponse)
def my_reels(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_reels(db, current_user.id, limit, offset)


@reels_router.get("/feed/", response_model=ReelsListResponse)
def feed_reels(limit: int = 10, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_feed_reels(db, current_user.id, limit, offset)


@reels_router.get("/{reels_id}/", response_model=ReelResponse)
def reels_detail(reels_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "reel": get_reel(reels_id, db, current_user.id)
    }


@reels_router.post("/{reels_id}/view/", response_model=ReelResponse)
def watch_reels(reels_id: int, data: ReelWatchUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "reel": update_reel_view(reels_id, data, db, current_user.id)
    }


@reels_router.get("/{reels_id}/viewers/", response_model=ProfileSearchResponse)
def reels_viewers(reels_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_reel_viewers(reels_id, db, current_user.id, limit, offset)


@reels_router.delete("/{reels_id}/", status_code=204)
def delete_my_reels(reels_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_reel(reels_id, db, current_user.id)
    return Response(status_code=204)
