from fastapi import HTTPException
from sqlalchemy.orm import Session

from chats.models import Chat, DirectMessage
from chats.schemas import DirectMessageCreate
from profiles.models import Profile
from realtime.manager import send_realtime_event_to_users
from users.permissions import can_send_message
from utils import get_dushanbe_time


def get_profile_or_404(username: str, db: Session):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


def get_chat_or_404(chat_id: int, db: Session):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    return chat


def check_chat_member(chat: Chat, user_id: int):
    if chat.user_id_1 != user_id and chat.user_id_2 != user_id:
        raise HTTPException(status_code=403, detail="You are not a member of this chat")


def get_chat_companion_id(chat: Chat, user_id: int):
    if chat.user_id_1 == user_id:
        return chat.user_id_2

    return chat.user_id_1


def get_message_data(message: DirectMessage, profile: Profile):
    return {
        "id": message.id,
        "text": message.text,
        "media_url": message.media_url,
        "is_read": message.is_read,
        "created_at": message.created_at,
        "sender": get_compact_profile_data(profile)
    }


def get_compact_profile_data(profile: Profile):
    return {
        "id": profile.user_id,
        "username": profile.username,
        "avatar_url": profile.avatar_url
    }


def get_message_realtime_data(message: DirectMessage, profile: Profile):
    return {
        "id": message.id,
        "text": message.text,
        "media_url": message.media_url,
        "is_read": message.is_read,
        "created_at": message.created_at.isoformat(),
        "sender": get_compact_profile_data(profile)
    }


def get_message_response(message: DirectMessage, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == message.sender_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Message sender profile not found")

    return {
        "message": get_message_data(message, profile)
    }


def get_chat_data(chat: Chat, db: Session):
    user_1_profile = db.query(Profile).filter(Profile.user_id == chat.user_id_1).first()
    user_2_profile = db.query(Profile).filter(Profile.user_id == chat.user_id_2).first()

    if user_1_profile is None or user_2_profile is None:
        raise HTTPException(status_code=404, detail="Chat user profile not found")

    last_message = db.query(DirectMessage).filter(
        DirectMessage.chat_id == chat.id
    ).order_by(DirectMessage.created_at.desc()).first()

    last_message_data = None

    if last_message:
        sender_profile = db.query(Profile).filter(Profile.user_id == last_message.sender_id).first()

        if sender_profile:
            last_message_data = get_message_data(last_message, sender_profile)

    return {
        "id": chat.id,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at,
        "user_1": get_compact_profile_data(user_1_profile),
        "user_2": get_compact_profile_data(user_2_profile),
        "last_message": last_message_data
    }


def create_or_get_chat(username: str, db: Session, user_id: int):
    my_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if my_profile is None:
        raise HTTPException(status_code=404, detail="My profile not found")

    profile = get_profile_or_404(username, db)

    if profile.user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot create chat with yourself")

    if not can_send_message(db, user_id, profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot create chat with this user")

    user_id_1 = min(user_id, profile.user_id)
    user_id_2 = max(user_id, profile.user_id)

    chat = db.query(Chat).filter(
        ((Chat.user_id_1 == user_id) & (Chat.user_id_2 == profile.user_id)) |
        ((Chat.user_id_1 == profile.user_id) & (Chat.user_id_2 == user_id))
    ).first()

    if chat:
        return {
            "chat": get_chat_data(chat, db)
        }

    new_chat = Chat(
        user_id_1=user_id_1,
        user_id_2=user_id_2,
        updated_at=get_dushanbe_time()
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return {
        "chat": get_chat_data(new_chat, db)
    }


def get_my_chats(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    chats = db.query(Chat).filter(
        (Chat.user_id_1 == user_id) | (Chat.user_id_2 == user_id)
    ).order_by(Chat.updated_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(chats) > limit
    chats = chats[:limit]

    chats_data = []
    for chat in chats:
        chats_data.append(get_chat_data(chat, db))

    return {
        "chats": chats_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def get_chat_detail(chat_id: int, db: Session, user_id: int):
    chat = get_chat_or_404(chat_id, db)
    check_chat_member(chat, user_id)

    return {
        "chat": get_chat_data(chat, db)
    }


def create_direct_message(chat_id: int, data: DirectMessageCreate, db: Session, user_id: int):
    chat = get_chat_or_404(chat_id, db)
    check_chat_member(chat, user_id)
    companion_id = get_chat_companion_id(chat, user_id)

    if not can_send_message(db, user_id, companion_id):
        raise HTTPException(status_code=403, detail="You cannot send message to this user")

    if data.text is None and data.media_url is None:
        raise HTTPException(status_code=400, detail="Message text or media is required")

    new_message = DirectMessage(
        chat_id=chat_id,
        sender_id=user_id,
        text=data.text,
        media_url=data.media_url
    )

    chat.updated_at = get_dushanbe_time()

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    sender_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if sender_profile:
        send_realtime_event_to_users(
            [chat.user_id_1, chat.user_id_2],
            {
                "event": "direct_message",
                "chat_id": chat_id,
                "message": get_message_realtime_data(new_message, sender_profile)
            }
        )

    return get_message_response(new_message, db)


def get_chat_messages(chat_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    chat = get_chat_or_404(chat_id, db)
    check_chat_member(chat, user_id)

    messages = db.query(DirectMessage).filter(
        DirectMessage.chat_id == chat_id
    ).order_by(DirectMessage.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(messages) > limit
    messages = messages[:limit]

    user_ids = [message.sender_id for message in messages]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    messages_data = []
    for message in messages:
        profile = profiles_by_user_id.get(message.sender_id)

        if profile:
            messages_data.append(get_message_data(message, profile))

    return {
        "messages": messages_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def read_chat_messages(chat_id: int, db: Session, user_id: int):
    chat = get_chat_or_404(chat_id, db)
    check_chat_member(chat, user_id)

    messages = db.query(DirectMessage).filter(
        DirectMessage.chat_id == chat_id,
        DirectMessage.sender_id != user_id,
        DirectMessage.is_read == False
    ).all()

    for message in messages:
        message.is_read = True

    db.commit()

    return {"message": "Messages marked as read"}
