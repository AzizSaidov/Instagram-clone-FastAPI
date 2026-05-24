from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class StoryCreate(BaseModel):
    media_url: str | None = None
    post_id: int | None = None

    @field_validator("media_url")
    @classmethod
    def validate_media_url(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Media URL cannot be empty")

        if len(value) > 255:
            raise ValueError("Media URL must be less than 255 characters")

        return value

    @model_validator(mode="after")
    def validate_story_source(self):
        if self.media_url is None and self.post_id is None:
            raise ValueError("Story must have media_url or post_id")

        if self.media_url is not None and self.post_id is not None:
            raise ValueError("Story cannot have both media_url and post_id")

        return self


class StoryUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class StoryRead(BaseModel):
    id: int
    user_id: int
    post_id: int | None
    media_url: str | None
    expires_at: datetime
    views_count: int
    created_at: datetime
    user: StoryUserRead

    model_config = ConfigDict(from_attributes=True)


class StoryResponse(BaseModel):
    story: StoryRead


class StoriesListResponse(BaseModel):
    stories: list[StoryRead]
    limit: int
    offset: int
    has_next: bool
