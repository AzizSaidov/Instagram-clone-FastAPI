from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from users.auth import get_current_user
from users.models import User
from users.schemas import LoginSchema, TokenSchema, UserCreate, UserMeResponse, UserRegisterResponse
from users.views import get_me, login_user, register_user


users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.post("/register/", response_model=UserRegisterResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return register_user(data, db)


@users_router.post("/login/", response_model=TokenSchema)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    return login_user(data, db)


@users_router.get("/me/", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user)):
    return get_me(current_user)
