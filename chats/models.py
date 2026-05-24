from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from utils import get_dushanbe_time


class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = (
        UniqueConstraint("user_id_1", "user_id_2", name="uq_chat_users"),
        CheckConstraint("user_id_1 < user_id_2", name="ck_chat_users_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id_1: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_id_2: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    user_1 = relationship("User", foreign_keys=[user_id_1])
    user_2 = relationship("User", foreign_keys=[user_id_2])
    messages = relationship("DirectMessage", back_populates="chat", cascade="all, delete-orphan")


class DirectMessage(Base):
    __tablename__ = "direct_message"
    __table_args__ = (
        CheckConstraint("text IS NOT NULL OR media_url IS NOT NULL", name="ck_direct_message_has_content"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_dushanbe_time, nullable=False)

    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User")
