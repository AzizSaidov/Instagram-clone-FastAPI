from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ReelCreate(BaseModel):
    video_url: str
    description: str | None = None
    hashtag: str | None = None

    @field_validator("video_url")
    @classmethod
    def validate_video_url(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Video URL is required")

        if len(value) > 255:
            raise ValueError("Video URL must be less than 255 characters")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 500:
            raise ValueError("Description must be less than 500 characters")

        return value

    @field_validator("hashtag")
    @classmethod
    def validate_hashtag(cls, value: str | None):
        if value is None:
            return value

        value = value.strip().lower()

        if len(value) > 255:
            raise ValueError("Hashtag must be less than 255 characters")

        return value


class ReelWatchUpdate(BaseModel):
    watched_percent: int

    @field_validator("watched_percent")
    @classmethod
    def validate_watched_percent(cls, value: int):
        if value < 0:
            raise ValueError("Watched percent must be at least 0")

        if value > 100:
            raise ValueError("Watched percent must be at most 100")

        return value


class ReelUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class ReelRead(BaseModel):
    id: int
    user_id: int
    video_url: str
    description: str | None
    hashtag: str | None
    views_count: int
    likes_count: int
    comments_count: int
    is_liked: bool
    created_at: datetime
    user: ReelUserRead

    model_config = ConfigDict(from_attributes=True)


class ReelResponse(BaseModel):
    reel: ReelRead


class ReelsListResponse(BaseModel):
    reels: list[ReelRead]
    limit: int
    offset: int
    has_next: bool
