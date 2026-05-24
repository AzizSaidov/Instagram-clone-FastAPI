from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_like_post"),
        UniqueConstraint("user_id", "comment_id", name="uq_like_comment"),
        UniqueConstraint("user_id", "reels_id", name="uq_like_reels"),
        CheckConstraint(
            "(CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN reels_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_like_one_target",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int | None] = mapped_column(ForeignKey("posts.id"), nullable=True)
    comment_id: Mapped[int | None] = mapped_column(ForeignKey("comments.id"), nullable=True)
    reels_id: Mapped[int | None] = mapped_column(ForeignKey("reels.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    user = relationship("User")
    post = relationship("Post")
    comment = relationship("Comment")
    reel = relationship("Reel")
