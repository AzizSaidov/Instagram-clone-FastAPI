from fastapi import FastAPI
from database import Base, engine

from users.models import User
from profiles.models import Profile
from routers.users_router import users_router

app = FastAPI(title="Insta FastAPI")


Base.metadata.create_all(bind=engine)

app.include_router(users_router)
