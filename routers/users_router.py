from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from users.auth import get_current_user
from users.models import User
from users.schemas import AccessTokenSchema, ChangePasswordSchema, LoginSchema, RefreshTokenSchema, TokenSchema, UserCreate, UserRegisterResponse
from users.views import change_password, login_user, refresh_access_token, register_user


users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.post("/register/", response_model=UserRegisterResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return register_user(data, db)


@users_router.post("/login/", response_model=TokenSchema)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    return login_user(data, db)


@users_router.post("/refresh/", response_model=AccessTokenSchema)
def refresh_token(data: RefreshTokenSchema, db: Session = Depends(get_db)):
    return refresh_access_token(data, db)


@users_router.put("/change-password/")
def update_password(data: ChangePasswordSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return change_password(data, db, current_user.id)
