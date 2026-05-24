from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from stories.schemas import StoriesListResponse, StoryCreate, StoryResponse
from stories.views import create_story, create_story_view, get_story, get_user_stories
from users.auth import get_current_user
from users.models import User


stories_router = APIRouter(prefix="/stories", tags=["Stories"])

STORIES_MEDIA_DIR = Path("media/stories")
ALLOWED_STORIES_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"]


def save_story_file(file: UploadFile):
    if file.content_type not in ALLOWED_STORIES_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media type")

    file_extension = Path(file.filename).suffix
    file_name = f"{uuid4()}{file_extension}"
    file_path = STORIES_MEDIA_DIR / file_name

    with open(file_path, "wb") as media_file:
        media_file.write(file.file.read())

    return f"/media/stories/{file_name}"


@stories_router.post("/", response_model=StoryResponse, status_code=201)
def create_my_story(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media_url = save_story_file(file)

    data = StoryCreate(
        media_url=media_url,
    )

    return {
        "story": create_story(data, db, current_user.id)
    }


@stories_router.post("/from-post/{post_id}/", response_model=StoryResponse, status_code=201)
def create_story_from_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = StoryCreate(
        post_id=post_id,
    )

    return {
        "story": create_story(data, db, current_user.id)
    }


@stories_router.get("/my/", response_model=StoriesListResponse)
def my_stories(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_stories(db, current_user.id, limit, offset)


@stories_router.get("/{story_id}/", response_model=StoryResponse)
def story_detail(story_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "story": get_story(story_id, db, current_user.id)
    }


@stories_router.post("/{story_id}/view/", response_model=StoryResponse)
def view_story(story_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "story": create_story_view(story_id, db, current_user.id)
    }
