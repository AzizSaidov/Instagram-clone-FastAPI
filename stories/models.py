from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Story(Base):
    __tablename__ = "stories"
    __table_args__ = (
        CheckConstraint(
            "(CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN media_url IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_story_one_source",
        ),
        CheckConstraint("views_count >= 0", name="ck_story_views_count_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int | None] = mapped_column(ForeignKey("posts.id"), nullable=True)
    media_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    user = relationship("User")
    post = relationship("Post")
    views = relationship("StoryView", back_populates="story", cascade="all, delete-orphan")


class StoryView(Base):
    __tablename__ = "story_views"
    __table_args__ = (
        UniqueConstraint("story_id", "user_id", name="uq_story_view_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    story_id: Mapped[int] = mapped_column(ForeignKey("stories.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    story = relationship("Story", back_populates="views")
    user = relationship("User")
