from fastapi import FastAPI
from database import Base, engine

from users.models import User
from profiles.models import Profile
from routers.profiles_router import profiles_router
from routers.users_router import users_router

app = FastAPI(title="Instagram FastAPI")


Base.metadata.create_all(bind=engine)

app.include_router(users_router)
app.include_router(profiles_router)
