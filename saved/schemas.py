from datetime import datetime

from pydantic import BaseModel, ConfigDict

from posts.schemas import PostRead
from reels.schemas import ReelRead


class ToggleSavedResponse(BaseModel):
    is_saved: bool
    message: str


class SavedPostRead(BaseModel):
    id: int
    post_id: int
    created_at: datetime
    post: PostRead

    model_config = ConfigDict(from_attributes=True)


class PaginationSchema(BaseModel):
    limit: int
    offset: int
    has_next: bool


class SavedPostsListResponse(BaseModel):
    saved_posts: list[SavedPostRead]
    pagination: PaginationSchema


class SavedReelRead(BaseModel):
    id: int
    reels_id: int
    created_at: datetime
    reel: ReelRead

    model_config = ConfigDict(from_attributes=True)


class SavedReelsListResponse(BaseModel):
    saved_reels: list[SavedReelRead]
    pagination: PaginationSchema
