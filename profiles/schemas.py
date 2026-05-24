from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from posts.schemas import PostRead
from reels.schemas import ReelRead


class ProfileRead(BaseModel):
    id: int
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    is_private: bool

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    username: str | None = None
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    is_private: bool | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None):
        if value is None:
            return value

        value = value.strip().lower()

        if len(value) < 3 or len(value) > 30:
            raise ValueError("Username must be 3-30 characters")

        if " " in value:
            raise ValueError("Username cannot contain spaces")

        return value

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 100:
            raise ValueError("Full name must be less than 100 characters")

        return value

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 150:
            raise ValueError("Bio must be less than 150 characters")

        return value

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 255:
            raise ValueError("Avatar URL must be less than 255 characters")

        return value


class MyProfileRead(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    is_private: bool

    model_config = ConfigDict(from_attributes=True)


class UserProfileRead(BaseModel):
    id: int
    phone_number: str
    created_at: datetime
    profile: MyProfileRead

    model_config = ConfigDict(from_attributes=True)


class MyProfileResponse(BaseModel):
    user: UserProfileRead


class ProfilePageRead(BaseModel):
    id: int
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    is_private: bool
    posts_count: int
    reels_count: int
    followers_count: int
    following_count: int


class ProfilePagePagination(BaseModel):
    limit: int
    offset: int
    has_next: bool


class ProfilePageResponse(BaseModel):
    profile: ProfilePageRead
    posts: list[PostRead]
    reels: list[ReelRead]
    pagination: ProfilePagePagination


class ProfileSearchRead(BaseModel):
    id: int
    username: str
    full_name: str | None
    avatar_url: str | None
    is_private: bool

    model_config = ConfigDict(from_attributes=True)


class ProfileSearchResponse(BaseModel):
    users: list[ProfileSearchRead]
    limit: int
    offset: int
    has_next: bool
