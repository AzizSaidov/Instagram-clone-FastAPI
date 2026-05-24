from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


def validate_group_name(value: str):
    value = value.strip()

    if not value:
        raise ValueError("Group name is required")

    if len(value) > 100:
        raise ValueError("Group name must be less than 100 characters")

    return value


class GroupCreate(BaseModel):
    name: str
    avatar_url: str | None = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str):
        return validate_group_name(value)

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        if len(value) > 255:
            raise ValueError("Avatar URL must be less than 255 characters")

        return value


class GroupUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str | None):
        if value is None:
            return value

        return validate_group_name(value)

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        if len(value) > 255:
            raise ValueError("Avatar URL must be less than 255 characters")

        return value


class GroupMessageCreate(BaseModel):
    text: str | None = None
    media_url: str | None = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        if len(value) > 1000:
            raise ValueError("Message text must be less than 1000 characters")

        return value

    @field_validator("media_url")
    @classmethod
    def validate_media_url(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        if len(value) > 255:
            raise ValueError("Media URL must be less than 255 characters")

        return value


class GroupUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class GroupMessageRead(BaseModel):
    id: int
    text: str | None
    media_url: str | None
    is_read: bool
    created_at: datetime
    sender: GroupUserRead


class GroupRead(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime
    owner: GroupUserRead
    members_count: int
    last_message: GroupMessageRead | None


class GroupResponse(BaseModel):
    group: GroupRead


class GroupsListResponse(BaseModel):
    groups: list[GroupRead]
    limit: int
    offset: int
    has_next: bool


class GroupMembersListResponse(BaseModel):
    users: list[GroupUserRead]
    limit: int
    offset: int
    has_next: bool


class GroupMessageResponse(BaseModel):
    message: GroupMessageRead


class GroupMessagesListResponse(BaseModel):
    messages: list[GroupMessageRead]
    limit: int
    offset: int
    has_next: bool
