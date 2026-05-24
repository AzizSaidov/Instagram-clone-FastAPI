from sqlalchemy.orm import Session

from blacklist.models import BlackList
from chats.models import Chat
from follows.models import Follow
from groups.models import GroupMember
from profiles.models import Profile


def is_blocked(db: Session, user_id: int, target_user_id: int):
    blacklist = db.query(BlackList).filter(
        (
            (BlackList.blocker_id == user_id) &
            (BlackList.blocked_id == target_user_id)
        ) |
        (
            (BlackList.blocker_id == target_user_id) &
            (BlackList.blocked_id == user_id)
        )
    ).first()

    return blacklist is not None


def is_following(db: Session, user_id: int, target_user_id: int):
    follow = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == target_user_id,
        Follow.is_accepted == True
    ).first()

    return follow is not None


def can_view_profile(db: Session, user_id: int, target_user_id: int):
    if user_id == target_user_id:
        return True

    if is_blocked(db, user_id, target_user_id):
        return False

    return True


def can_view_content(db: Session, user_id: int, target_user_id: int):
    if user_id == target_user_id:
        return True

    if is_blocked(db, user_id, target_user_id):
        return False

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()

    if profile is None:
        return False

    if not profile.is_private:
        return True

    return is_following(db, user_id, target_user_id)


def can_send_message(db: Session, user_id: int, target_user_id: int):
    if user_id == target_user_id:
        return False

    if is_blocked(db, user_id, target_user_id):
        return False

    return True


def is_chat_member(chat: Chat, user_id: int):
    return chat.user_id_1 == user_id or chat.user_id_2 == user_id


def is_group_member(db: Session, group_id: int, user_id: int):
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()

    return member is not None
