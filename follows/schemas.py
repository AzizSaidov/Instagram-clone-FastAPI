from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FollowProfileRead(BaseModel):
    id: int
    username: str
    full_name: str | None
    avatar_url: str | None
    is_private: bool

    model_config = ConfigDict(from_attributes=True)


class FollowRead(BaseModel):
    id: int
    is_accepted: bool
    created_at: datetime
    follower: FollowProfileRead
    following: FollowProfileRead


class FollowResponse(BaseModel):
    follow: FollowRead


class FollowsListResponse(BaseModel):
    users: list[FollowProfileRead]
    limit: int
    offset: int
    has_next: bool
