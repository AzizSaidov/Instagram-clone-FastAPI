from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from follows.models import Follow
from notes.models import Note
from notes.schemas import NoteCreate
from profiles.models import Profile
from utils import get_dushanbe_time


def get_note_data(note: Note, profile: Profile):
    return {
        "id": note.id,
        "text": note.text,
        "expires_at": note.expires_at,
        "created_at": note.created_at,
        "user": profile
    }


def get_note_response(note: Note, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == note.user_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Note author profile not found")

    return {
        "note": get_note_data(note, profile)
    }


def create_note(data: NoteCreate, db: Session, user_id: int):
    active_note = db.query(Note).filter(
        Note.user_id == user_id,
        Note.expires_at > get_dushanbe_time()
    ).first()

    if active_note:
        db.delete(active_note)

    new_note = Note(
        user_id=user_id,
        text=data.text,
        expires_at=get_dushanbe_time() + timedelta(hours=24)
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return get_note_response(new_note, db)


def get_my_note(db: Session, user_id: int):
    note = db.query(Note).filter(
        Note.user_id == user_id,
        Note.expires_at > get_dushanbe_time()
    ).first()

    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    return get_note_response(note, db)


def delete_my_note(db: Session, user_id: int):
    note = db.query(Note).filter(
        Note.user_id == user_id,
        Note.expires_at > get_dushanbe_time()
    ).first()

    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()

    return {"message": "Note deleted successfully"}


def get_following_notes(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    follows = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.is_accepted == True
    ).all()

    following_ids = [follow.following_id for follow in follows]
    following_ids.append(user_id)

    notes = db.query(Note).filter(
        Note.user_id.in_(following_ids),
        Note.expires_at > get_dushanbe_time()
    ).order_by(Note.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(notes) > limit
    notes = notes[:limit]

    user_ids = [note.user_id for note in notes]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}

    notes_data = []
    for note in notes:
        profile = profiles_by_user_id.get(note.user_id)

        if profile:
            notes_data.append(get_note_data(note, profile))

    return {
        "notes": notes_data,
        "limit": limit,
        "offset": offset,
        "has_next": has_next
    }
