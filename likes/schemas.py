from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LikeUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class LikeRead(BaseModel):
    id: int
    post_id: int | None
    comment_id: int | None
    reels_id: int | None
    created_at: datetime
    user: LikeUserRead


class ToggleLikeResponse(BaseModel):
    is_liked: bool
    like: LikeRead | None


class LikesListResponse(BaseModel):
    likes: list[LikeRead]
    limit: int
    offset: int
    has_next: bool
