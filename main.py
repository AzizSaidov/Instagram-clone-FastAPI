import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from database import Base, engine

from users.models import User
from profiles.models import Profile
from posts.models import Post, PostMedia, PostView
from reels.models import Reel, ReelView
from stories.models import Story, StoryView
from follows.models import Follow
from comments.models import Comment
from likes.models import Like
from blacklist.models import BlackList
from notes.models import Note
from notifications.models import Notification
from chats.models import Chat, DirectMessage
from groups.models import Group, GroupMember, GroupMessage

from routers.blacklist_router import blacklist_router
from routers.chats_router import chats_router
from routers.comments_router import comments_router
from routers.follows_router import follows_router
from routers.groups_router import groups_router
from routers.likes_router import likes_router
from routers.notes_router import notes_router
from routers.notifications_router import notifications_router
from routers.posts_router import posts_router
from routers.profiles_router import profiles_router
from routers.reels_router import reels_router
from routers.stories_router import stories_router
from routers.users_router import users_router
from routers.websocket_router import websocket_router
from realtime.manager import set_realtime_loop

app = FastAPI(title="Instagram FastAPI")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.mount("/media", StaticFiles(directory="media"), name="media")

app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(posts_router)
app.include_router(reels_router)
app.include_router(stories_router)
app.include_router(follows_router)
app.include_router(comments_router)
app.include_router(likes_router)
app.include_router(blacklist_router)
app.include_router(notes_router)
app.include_router(notifications_router)
app.include_router(chats_router)
app.include_router(groups_router)
app.include_router(websocket_router)


@app.on_event("startup")
async def startup_event():
    set_realtime_loop(asyncio.get_running_loop())


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        routes=app.routes,
    )

    openapi_schema["openapi"] = "3.0.3"

    def fix_file_fields(value):
        if isinstance(value, dict):
            if value.get("contentMediaType") == "application/octet-stream":
                value.pop("contentMediaType")
                value["format"] = "binary"

            for item in value.values():
                fix_file_fields(item)

        if isinstance(value, list):
            for item in value:
                fix_file_fields(item)

    fix_file_fields(openapi_schema)
    app.openapi_schema = openapi_schema

    return app.openapi_schema


app.openapi = custom_openapi
