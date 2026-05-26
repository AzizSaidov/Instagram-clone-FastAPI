from fastapi import HTTPException
from sqlalchemy.orm import Session

from groups.models import Group, GroupMember, GroupMessage
from groups.schemas import GroupCreate, GroupMessageCreate, GroupUpdate
from profiles.models import Profile
from realtime.manager import send_realtime_event_to_users
from users.permissions import is_blocked
from utils import get_dushanbe_time


def get_profile_or_404(username: str, db: Session):
    username = username.strip().lower()
    profile = db.query(Profile).filter(Profile.username == username).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


def get_group_or_404(group_id: int, db: Session):
    group = db.query(Group).filter(Group.id == group_id).first()

    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    return group


def get_group_member(group_id: int, user_id: int, db: Session):
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()


def check_group_member(group_id: int, user_id: int, db: Session):
    member = get_group_member(group_id, user_id, db)

    if member is None:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    return member


def check_group_owner(group: Group, user_id: int):
    if group.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only group owner can do this")


def get_compact_profile_data(profile: Profile):
    return {
        "id": profile.user_id,
        "username": profile.username,
        "avatar_url": profile.avatar_url
    }


def get_group_message_data(message: GroupMessage, profile: Profile):
    return {
        "id": message.id,
        "text": message.text,
        "media_url": message.media_url,
        "is_read": message.is_read,
        "created_at": message.created_at,
        "sender": get_compact_profile_data(profile)
    }


def get_group_message_realtime_data(message: GroupMessage, profile: Profile):
    return {
        "id": message.id,
        "text": message.text,
        "media_url": message.media_url,
        "is_read": message.is_read,
        "created_at": message.created_at.isoformat(),
        "sender": get_compact_profile_data(profile)
    }


def get_group_message_response(message: GroupMessage, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == message.sender_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Message sender profile not found")

    return {
        "message": get_group_message_data(message, profile)
    }


def get_group_data(group: Group, db: Session):
    owner_profile = db.query(Profile).filter(Profile.user_id == group.owner_id).first()

    if owner_profile is None:
        raise HTTPException(status_code=404, detail="Group owner profile not found")

    members_count = db.query(GroupMember).filter(GroupMember.group_id == group.id).count()

    last_message = db.query(GroupMessage).filter(
        GroupMessage.group_id == group.id
    ).order_by(GroupMessage.created_at.desc()).first()

    last_message_data = None

    if last_message:
        sender_profile = db.query(Profile).filter(Profile.user_id == last_message.sender_id).first()

        if sender_profile:
            last_message_data = get_group_message_data(last_message, sender_profile)

    return {
        "id": group.id,
        "name": group.name,
        "avatar_url": group.avatar_url,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "owner": get_compact_profile_data(owner_profile),
        "members_count": members_count,
        "last_message": last_message_data
    }


def create_group(data: GroupCreate, db: Session, user_id: int):
    my_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if my_profile is None:
        raise HTTPException(status_code=404, detail="My profile not found")

    new_group = Group(
        owner_id=user_id,
        name=data.name,
        avatar_url=data.avatar_url,
        updated_at=get_dushanbe_time()
    )

    db.add(new_group)
    db.flush()

    owner_member = GroupMember(
        group_id=new_group.id,
        user_id=user_id
    )

    db.add(owner_member)
    db.commit()
    db.refresh(new_group)

    return {
        "group": get_group_data(new_group, db)
    }


def update_group(group_id: int, data: GroupUpdate, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_owner(group, user_id)

    if data.name is not None:
        group.name = data.name

    if data.avatar_url is not None:
        group.avatar_url = data.avatar_url

    db.commit()
    db.refresh(group)

    return {
        "group": get_group_data(group, db)
    }


def delete_group(group_id: int, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_owner(group, user_id)

    db.delete(group)
    db.commit()

    return {"message": "Group deleted successfully"}


def get_my_groups(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == user_id
    ).all()

    group_ids = [membership.group_id for membership in memberships]

    groups = db.query(Group).filter(
        Group.id.in_(group_ids)
    ).order_by(Group.updated_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(groups) > limit
    groups = groups[:limit]

    groups_data = []
    for group in groups:
        groups_data.append(get_group_data(group, db))

    return {
        "groups": groups_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def get_group_detail(group_id: int, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_member(group_id, user_id, db)

    return {
        "group": get_group_data(group, db)
    }


def add_group_member(group_id: int, username: str, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_owner(group, user_id)

    profile = get_profile_or_404(username, db)

    if is_blocked(db, user_id, profile.user_id):
        raise HTTPException(status_code=403, detail="You cannot add this user to group")

    existing_member = get_group_member(group_id, profile.user_id, db)

    if existing_member:
        raise HTTPException(status_code=400, detail="User already in group")

    new_member = GroupMember(
        group_id=group_id,
        user_id=profile.user_id
    )

    db.add(new_member)
    db.commit()

    return {
        "group": get_group_data(group, db)
    }


def remove_group_member(group_id: int, username: str, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_owner(group, user_id)

    profile = get_profile_or_404(username, db)

    if profile.user_id == group.owner_id:
        raise HTTPException(status_code=400, detail="Owner cannot be removed from group")

    member = get_group_member(group_id, profile.user_id, db)

    if member is None:
        raise HTTPException(status_code=404, detail="Group member not found")

    db.delete(member)
    db.commit()

    return {"message": "Group member removed successfully"}


def leave_group(group_id: int, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)

    if group.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Owner cannot leave group")

    member = get_group_member(group_id, user_id, db)

    if member is None:
        raise HTTPException(status_code=404, detail="Group member not found")

    db.delete(member)
    db.commit()

    return {"message": "Left group successfully"}


def get_group_members(group_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    group = get_group_or_404(group_id, db)
    check_group_member(group.id, user_id, db)

    members = db.query(GroupMember).filter(
        GroupMember.group_id == group_id
    ).order_by(GroupMember.joined_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(members) > limit
    members = members[:limit]

    user_ids = [member.user_id for member in members]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    users = []
    for member in members:
        profile = profiles_by_user_id.get(member.user_id)

        if profile:
            users.append(get_compact_profile_data(profile))

    return {
        "users": users,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def create_group_message(group_id: int, data: GroupMessageCreate, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_member(group_id, user_id, db)

    if data.text is None and data.media_url is None:
        raise HTTPException(status_code=400, detail="Message text or media is required")

    new_message = GroupMessage(
        group_id=group_id,
        sender_id=user_id,
        text=data.text,
        media_url=data.media_url
    )

    group.updated_at = get_dushanbe_time()

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    sender_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    member_ids = [member.user_id for member in members]

    if sender_profile:
        send_realtime_event_to_users(
            member_ids,
            {
                "event": "group_message",
                "group_id": group_id,
                "message": get_group_message_realtime_data(new_message, sender_profile)
            }
        )

    return get_group_message_response(new_message, db)


def get_group_messages(group_id: int, db: Session, user_id: int, limit: int = 20, offset: int = 0):
    group = get_group_or_404(group_id, db)
    check_group_member(group.id, user_id, db)

    messages = db.query(GroupMessage).filter(
        GroupMessage.group_id == group_id
    ).order_by(GroupMessage.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(messages) > limit
    messages = messages[:limit]

    user_ids = [message.sender_id for message in messages]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    messages_data = []
    for message in messages:
        profile = profiles_by_user_id.get(message.sender_id)

        if profile:
            messages_data.append(get_group_message_data(message, profile))

    return {
        "messages": messages_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def read_group_messages(group_id: int, db: Session, user_id: int):
    group = get_group_or_404(group_id, db)
    check_group_member(group.id, user_id, db)

    messages = db.query(GroupMessage).filter(
        GroupMessage.group_id == group_id,
        GroupMessage.sender_id != user_id,
        GroupMessage.is_read == False
    ).all()

    for message in messages:
        message.is_read = True

    db.commit()

    return {"message": "Group messages marked as read"}
