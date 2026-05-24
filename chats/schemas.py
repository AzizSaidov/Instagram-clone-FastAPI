from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class DirectMessageCreate(BaseModel):
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


class ChatUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class DirectMessageRead(BaseModel):
    id: int
    text: str | None
    media_url: str | None
    is_read: bool
    created_at: datetime
    sender: ChatUserRead


class DirectMessageResponse(BaseModel):
    message: DirectMessageRead


class DirectMessagesListResponse(BaseModel):
    messages: list[DirectMessageRead]
    limit: int
    offset: int
    has_next: bool


class ChatRead(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    user_1: ChatUserRead
    user_2: ChatUserRead
    last_message: DirectMessageRead | None


class ChatResponse(BaseModel):
    chat: ChatRead


class ChatsListResponse(BaseModel):
    chats: list[ChatRead]
    limit: int
    offset: int
    has_next: bool
