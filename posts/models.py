from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (
        CheckConstraint("views_count >= 0", name="ck_post_views_count_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    hashtag: Mapped[str | None] = mapped_column(String(255), nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    user = relationship("User")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    views = relationship("PostView", back_populates="post", cascade="all, delete-orphan")


class PostMedia(Base):
    __tablename__ = "post_media"
    __table_args__ = (
        UniqueConstraint("post_id", "order_index", name="uq_post_media_order"),
        CheckConstraint("order_index >= 0", name="ck_post_media_order_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False)
    media_url: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    post = relationship("Post", back_populates="media")


class PostView(Base):
    __tablename__ = "post_views"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_view_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    post = relationship("Post", back_populates="views")
    user = relationship("User")
