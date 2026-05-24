from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from notifications.schemas import NotificationResponse, NotificationsListResponse
from notifications.views import get_my_notifications, read_all_notifications, read_notification
from users.auth import get_current_user
from users.models import User


notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@notifications_router.get("/", response_model=NotificationsListResponse)
def my_notifications(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_notifications(db, current_user.id, limit, offset)


@notifications_router.put("/{notification_id}/read/", response_model=NotificationResponse)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return read_notification(notification_id, db, current_user.id)


@notifications_router.put("/read-all/")
def mark_all_notifications_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return read_all_notifications(db, current_user.id)
