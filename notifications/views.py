from fastapi import HTTPException
from sqlalchemy.orm import Session

from notifications.models import Notification
from profiles.models import Profile
from realtime.manager import send_realtime_event


NOTIFICATION_TYPES = ["like", "comment", "follow", "follow_request"]


def get_notification_or_404(notification_id: int, db: Session):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


def get_notification_data(notification: Notification, profile: Profile):
    return {
        "id": notification.id,
        "type": notification.type,
        "post_id": notification.post_id,
        "reels_id": notification.reels_id,
        "comment_id": notification.comment_id,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
        "from_user": profile
    }


def get_notification_realtime_data(notification: Notification, profile: Profile):
    return {
        "id": notification.id,
        "type": notification.type,
        "post_id": notification.post_id,
        "reels_id": notification.reels_id,
        "comment_id": notification.comment_id,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
        "from_user": {
            "id": profile.id,
            "username": profile.username,
            "avatar_url": profile.avatar_url
        }
    }


def get_notification_response(notification: Notification, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == notification.from_user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Notification sender profile not found")

    return {
        "notification": get_notification_data(notification, profile)
    }


def create_notification(
    to_user_id: int,
    from_user_id: int,
    notification_type: str,
    db: Session,
    post_id: int | None = None,
    reels_id: int | None = None,
    comment_id: int | None = None,
):
    if to_user_id == from_user_id:
        return None

    if notification_type not in NOTIFICATION_TYPES:
        raise HTTPException(status_code=400, detail="Invalid notification type")

    targets_count = 0

    if post_id is not None:
        targets_count += 1

    if reels_id is not None:
        targets_count += 1

    if comment_id is not None:
        targets_count += 1

    if notification_type in ["like", "comment"] and targets_count != 1:
        raise HTTPException(status_code=400, detail="Notification must have one target")

    if notification_type in ["follow", "follow_request"] and targets_count != 0:
        raise HTTPException(status_code=400, detail="Follow notification cannot have content target")

    new_notification = Notification(
        to_user_id=to_user_id,
        from_user_id=from_user_id,
        type=notification_type,
        post_id=post_id,
        reels_id=reels_id,
        comment_id=comment_id
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    profile = db.query(Profile).filter(Profile.user_id == from_user_id).first()

    if profile:
        send_realtime_event(
            to_user_id,
            {
                "event": "notification",
                "notification": get_notification_realtime_data(new_notification, profile)
            }
        )

    return new_notification


def get_my_notifications(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    notifications = db.query(Notification).filter(
        Notification.to_user_id == user_id
    ).order_by(Notification.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(notifications) > limit
    notifications = notifications[:limit]

    user_ids = [notification.from_user_id for notification in notifications]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    notifications_data = []
    for notification in notifications:
        profile = profiles_by_user_id.get(notification.from_user_id)

        if profile:
            notifications_data.append(get_notification_data(notification, profile))

    return {
        "notifications": notifications_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }


def read_notification(notification_id: int, db: Session, user_id: int):
    notification = get_notification_or_404(notification_id, db)

    if notification.to_user_id != user_id:
        raise HTTPException(status_code=403, detail="You cannot read this notification")

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return get_notification_response(notification, db)


def read_all_notifications(db: Session, user_id: int):
    notifications = db.query(Notification).filter(
        Notification.to_user_id == user_id,
        Notification.is_read == False
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {"message": "Notifications marked as read"}
