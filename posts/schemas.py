from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PostMediaCreate(BaseModel):
    media_url: str
    order_index: int = 0

    @field_validator("media_url")
    @classmethod
    def validate_media_url(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Media URL is required")

        if len(value) > 255:
            raise ValueError("Media URL must be less than 255 characters")

        return value


class PostCreate(BaseModel):
    description: str | None = None
    hashtag: str | None = None
    media: list[PostMediaCreate]

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 2200:
            raise ValueError("Description must be less than 2200 characters")

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

    @field_validator("media")
    @classmethod
    def validate_media(cls, value: list[PostMediaCreate]):
        if not value:
            raise ValueError("Post must have at least one media")

        if len(value) > 10:
            raise ValueError("Post can have at most 10 media files")

        return value


class PostMediaRead(BaseModel):
    id: int
    media_url: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class PostUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class PostRead(BaseModel):
    id: int
    user_id: int
    description: str | None
    hashtag: str | None
    views_count: int
    likes_count: int
    comments_count: int
    is_liked: bool
    is_saved: bool
    created_at: datetime
    media: list[PostMediaRead]
    user: PostUserRead

    model_config = ConfigDict(from_attributes=True)


class PostResponse(BaseModel):
    post: PostRead


class PostsListResponse(BaseModel):
    posts: list[PostRead]
    limit: int
    offset: int
    has_next: bool
