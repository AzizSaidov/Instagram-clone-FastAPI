from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from posts.schemas import PostCreate, PostMediaCreate, PostResponse, PostsListResponse
from posts.views import create_post, create_post_view, delete_post, get_explore_posts, get_feed_posts, get_post, get_post_viewers, get_user_posts
from profiles.schemas import ProfileSearchResponse
from users.auth import get_current_user
from users.models import User


posts_router = APIRouter(prefix="/posts", tags=["Posts"])

POSTS_MEDIA_DIR = Path("media/posts")
ALLOWED_POST_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"]


def save_post_file(file: UploadFile):
    if file.content_type not in ALLOWED_POST_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media type")

    file_extension = Path(file.filename).suffix
    file_name = f"{uuid4()}{file_extension}"
    file_path = POSTS_MEDIA_DIR / file_name

    with open(file_path, "wb") as media_file:
        media_file.write(file.file.read())

    return f"/media/posts/{file_name}"


@posts_router.post("/", response_model=PostResponse, status_code=201)
def create_my_post(
    description: str | None = Form(default=None),
    hashtag: str | None = Form(default=None),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Post can have at most 10 media files")

    media = []

    for index, file in enumerate(files):
        media_url = save_post_file(file)
        media.append(
            PostMediaCreate(
                media_url=media_url,
                order_index=index,
            )
        )

    data = PostCreate(
        description=description,
        hashtag=hashtag,
        media=media,
    )

    return {
        "post": create_post(data, db, current_user.id)
    }


@posts_router.get("/my/", response_model=PostsListResponse)
def my_posts(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_posts(db, current_user.id, limit, offset)


@posts_router.get("/feed/", response_model=PostsListResponse)
def feed_posts(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_feed_posts(db, current_user.id, limit, offset)


@posts_router.get("/explore/", response_model=PostsListResponse)
def explore_posts(limit: int = 24, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_explore_posts(db, current_user.id, limit, offset)


@posts_router.get("/{post_id}/", response_model=PostResponse)
def post_detail(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "post": get_post(post_id, db, current_user.id)
    }


@posts_router.post("/{post_id}/view/", response_model=PostResponse)
def view_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "post": create_post_view(post_id, db, current_user.id)
    }


@posts_router.get("/{post_id}/viewers/", response_model=ProfileSearchResponse)
def post_viewers(post_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_post_viewers(post_id, db, current_user.id, limit, offset)


@posts_router.delete("/{post_id}/", status_code=204)
def delete_my_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_post(post_id, db, current_user.id)
    return Response(status_code=204)
