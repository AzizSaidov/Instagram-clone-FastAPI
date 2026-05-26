from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None
    is_following: bool = False
    is_follow_requested: bool = False

    model_config = ConfigDict(from_attributes=True)


class NotificationRead(BaseModel):
    id: int
    type: str
    post_id: int | None
    reels_id: int | None
    comment_id: int | None
    is_read: bool
    created_at: datetime
    from_user: NotificationUserRead


class NotificationResponse(BaseModel):
    notification: NotificationRead


class NotificationsListResponse(BaseModel):
    notifications: list[NotificationRead]
    limit: int
    offset: int
    has_next: bool
