from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        CheckConstraint(
            "(CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN reels_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_comment_one_target",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int | None] = mapped_column(ForeignKey("posts.id"), nullable=True)
    reels_id: Mapped[int | None] = mapped_column(ForeignKey("reels.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    user = relationship("User")
    post = relationship("Post")
    reel = relationship("Reel")
