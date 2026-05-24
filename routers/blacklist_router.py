from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from blacklist.schemas import BlackListListResponse, BlackListResponse
from blacklist.views import block_user, get_blocked_users, unblock_user
from database import get_db
from users.auth import get_current_user
from users.models import User


blacklist_router = APIRouter(prefix="/blacklist", tags=["BlackList"])


@blacklist_router.post("/{username}/", response_model=BlackListResponse, status_code=201)
def block(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return block_user(username, db, current_user.id)


@blacklist_router.delete("/{username}/")
def unblock(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return unblock_user(username, db, current_user.id)


@blacklist_router.get("/", response_model=BlackListListResponse)
def my_blacklist(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_blocked_users(db, current_user.id, limit, offset)
