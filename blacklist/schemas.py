from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BlackListUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class BlackListRead(BaseModel):
    id: int
    created_at: datetime
    blocked_user: BlackListUserRead


class BlackListResponse(BaseModel):
    blacklist: BlackListRead


class BlackListListResponse(BaseModel):
    users: list[BlackListUserRead]
    limit: int
    offset: int
    has_next: bool
