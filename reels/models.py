from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Reel(Base):
    __tablename__ = "reels"
    __table_args__ = (
        CheckConstraint("views_count >= 0", name="ck_reel_views_count_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    video_url: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hashtag: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    user = relationship("User")
    views = relationship("ReelView", back_populates="reel", cascade="all, delete-orphan")


class ReelView(Base):
    __tablename__ = "reel_view"
    __table_args__ = (
        UniqueConstraint("reels_id", "user_id", name="uq_reel_view_user"),
        CheckConstraint("watched_percent >= 0 AND watched_percent <= 100", name="ck_reel_watched_percent"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reels_id: Mapped[int] = mapped_column(ForeignKey("reels.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    watched_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    reel = relationship("Reel", back_populates="views")
    user = relationship("User")
