from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "type IN ('like', 'comment', 'follow', 'follow_request')",
            name="ck_notification_type",
        ),
        CheckConstraint(
            "((type IN ('like', 'comment')) AND "
            "((CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN reels_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1)) "
            "OR "
            "((type IN ('follow', 'follow_request')) AND "
            "post_id IS NULL AND reels_id IS NULL AND comment_id IS NULL)",
            name="ck_notification_target",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    post_id: Mapped[int | None] = mapped_column(ForeignKey("posts.id"), nullable=True)
    reels_id: Mapped[int | None] = mapped_column(ForeignKey("reels.id"), nullable=True)
    comment_id: Mapped[int | None] = mapped_column(ForeignKey("comments.id"), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    to_user = relationship("User", foreign_keys=[to_user_id])
    from_user = relationship("User", foreign_keys=[from_user_id])
    post = relationship("Post")
    reel = relationship("Reel")
    comment = relationship("Comment")
