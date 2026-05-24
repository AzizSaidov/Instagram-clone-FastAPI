from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class NoteCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Note text is required")

        if len(value) > 60:
            raise ValueError("Note text must be less than 60 characters")

        return value


class NoteUserRead(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class NoteRead(BaseModel):
    id: int
    text: str
    expires_at: datetime
    created_at: datetime
    user: NoteUserRead


class NoteResponse(BaseModel):
    note: NoteRead


class NotesListResponse(BaseModel):
    notes: list[NoteRead]
    limit: int
    offset: int
    has_next: bool
