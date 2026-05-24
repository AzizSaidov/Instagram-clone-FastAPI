from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from notes.schemas import NoteCreate, NoteResponse, NotesListResponse
from notes.views import create_note, delete_my_note, get_following_notes, get_my_note
from users.auth import get_current_user
from users.models import User


notes_router = APIRouter(prefix="/notes", tags=["Notes"])


@notes_router.post("/", response_model=NoteResponse, status_code=201)
def create_my_note(data: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_note(data, db, current_user.id)


@notes_router.get("/me/", response_model=NoteResponse)
def my_note(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_note(db, current_user.id)


@notes_router.delete("/me/")
def delete_note(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_my_note(db, current_user.id)


@notes_router.get("/", response_model=NotesListResponse)
def notes_feed(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_following_notes(db, current_user.id, limit, offset)
