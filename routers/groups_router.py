from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from groups.schemas import (
    GroupCreate,
    GroupMembersListResponse,
    GroupMessageCreate,
    GroupMessageResponse,
    GroupMessagesListResponse,
    GroupResponse,
    GroupsListResponse,
    GroupUpdate,
)
from groups.views import (
    add_group_member,
    create_group,
    create_group_message,
    delete_group,
    get_group_detail,
    get_group_members,
    get_group_messages,
    get_my_groups,
    leave_group,
    read_group_messages,
    remove_group_member,
    update_group,
)
from users.auth import get_current_user
from users.models import User


groups_router = APIRouter(prefix="/groups", tags=["Groups"])

GROUP_MESSAGES_MEDIA_DIR = Path("media/group_messages")
ALLOWED_GROUP_MESSAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"]


def save_group_message_file(file: UploadFile):
    if file.content_type not in ALLOWED_GROUP_MESSAGE_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media type")

    file_extension = Path(file.filename).suffix
    file_name = f"{uuid4()}{file_extension}"
    file_path = GROUP_MESSAGES_MEDIA_DIR / file_name

    with open(file_path, "wb") as media_file:
        media_file.write(file.file.read())

    return f"/media/group_messages/{file_name}"


@groups_router.post("/", response_model=GroupResponse, status_code=201)
def create_my_group(data: GroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_group(data, db, current_user.id)


@groups_router.get("/", response_model=GroupsListResponse)
def my_groups(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_groups(db, current_user.id, limit, offset)


@groups_router.get("/{group_id}/", response_model=GroupResponse)
def group_detail(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_group_detail(group_id, db, current_user.id)


@groups_router.put("/{group_id}/", response_model=GroupResponse)
def update_my_group(group_id: int, data: GroupUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_group(group_id, data, db, current_user.id)


@groups_router.delete("/{group_id}/")
def delete_my_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_group(group_id, db, current_user.id)


@groups_router.get("/{group_id}/members/", response_model=GroupMembersListResponse)
def group_members(group_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_group_members(group_id, db, current_user.id, limit, offset)


@groups_router.post("/{group_id}/members/{username}/", response_model=GroupResponse)
def add_member(group_id: int, username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_group_member(group_id, username, db, current_user.id)


@groups_router.delete("/{group_id}/members/{username}/")
def remove_member(group_id: int, username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return remove_group_member(group_id, username, db, current_user.id)


@groups_router.post("/{group_id}/leave/")
def leave_my_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return leave_group(group_id, db, current_user.id)


@groups_router.post("/{group_id}/messages/", response_model=GroupMessageResponse, status_code=201)
def send_group_message(
    group_id: int,
    text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media_url = None

    if file is not None:
        media_url = save_group_message_file(file)

    data = GroupMessageCreate(
        text=text,
        media_url=media_url,
    )

    return create_group_message(group_id, data, db, current_user.id)


@groups_router.get("/{group_id}/messages/", response_model=GroupMessagesListResponse)
def group_messages(group_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_group_messages(group_id, db, current_user.id, limit, offset)


@groups_router.put("/{group_id}/read/")
def mark_group_read(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return read_group_messages(group_id, db, current_user.id)
