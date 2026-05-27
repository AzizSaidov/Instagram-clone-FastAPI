from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from chats.schemas import ChatResponse, ChatsListResponse, DirectMessageCreate, DirectMessageResponse, DirectMessagesListResponse
from chats.views import create_direct_message, create_or_get_chat, delete_chat, get_chat_detail, get_chat_messages, get_my_chats, read_chat_messages
from database import get_db
from users.auth import get_current_user
from users.models import User


chats_router = APIRouter(prefix="/chats", tags=["Chats"])

DIRECT_MESSAGES_MEDIA_DIR = Path("media/direct_messages")
ALLOWED_DIRECT_MESSAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"]


def save_direct_message_file(file: UploadFile):
    if file.content_type not in ALLOWED_DIRECT_MESSAGE_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media type")

    file_extension = Path(file.filename).suffix
    file_name = f"{uuid4()}{file_extension}"
    file_path = DIRECT_MESSAGES_MEDIA_DIR / file_name

    with open(file_path, "wb") as media_file:
        media_file.write(file.file.read())

    return f"/media/direct_messages/{file_name}"


@chats_router.get("/", response_model=ChatsListResponse)
def my_chats(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_chats(db, current_user.id, limit, offset)


@chats_router.post("/{username}/", response_model=ChatResponse, status_code=201)
def create_chat(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_or_get_chat(username, db, current_user.id)


@chats_router.get("/{chat_id}/", response_model=ChatResponse)
def chat_detail(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_chat_detail(chat_id, db, current_user.id)


@chats_router.delete("/{chat_id}/")
def delete_my_chat(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_chat(chat_id, db, current_user.id)


@chats_router.post("/{chat_id}/messages/", response_model=DirectMessageResponse, status_code=201)
def send_message(
    chat_id: int,
    text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media_url = None

    if file is not None:
        media_url = save_direct_message_file(file)

    data = DirectMessageCreate(
        text=text,
        media_url=media_url,
    )

    return create_direct_message(chat_id, data, db, current_user.id)


@chats_router.get("/{chat_id}/messages/", response_model=DirectMessagesListResponse)
def chat_messages(chat_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_chat_messages(chat_id, db, current_user.id, limit, offset)


@chats_router.put("/{chat_id}/read/")
def mark_chat_read(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return read_chat_messages(chat_id, db, current_user.id)
