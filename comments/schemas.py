from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


def validate_comment_text(value: str):
    value = value.strip()

    if not value:
        raise ValueError("Comment text is required")

    if len(value) > 500:
        raise ValueError("Comment text must be less than 500 characters")

    return value


class CommentCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def check_text(cls, value: str):
        return validate_comment_text(value)


class CommentUpdate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def check_text(cls, value: str):
        return validate_comment_text(value)


class CommentUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class CommentRead(BaseModel):
    id: int
    post_id: int | None
    reels_id: int | None
    text: str
    likes_count: int
    is_liked: bool
    created_at: datetime
    user: CommentUserRead


class CommentResponse(BaseModel):
    comment: CommentRead


class CommentsListResponse(BaseModel):
    comments: list[CommentRead]
    limit: int
    offset: int
    has_next: bool
