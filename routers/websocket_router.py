import json

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from database import get_db
from posts.models import Post
from realtime.manager import manager
from users.auth import get_user_from_token
from users.models import User
from users.permissions import can_view_content


websocket_router = APIRouter(tags=["WebSocket"])


def can_subscribe_to_topic(topic: str, current_user: User, db: Session):
    topic_type, _, raw_id = topic.partition(":")

    if topic_type != "post" or not raw_id.isdigit():
        return False

    post = db.query(Post).filter(Post.id == int(raw_id)).first()

    if post is None:
        return False

    return can_view_content(db, current_user.id, post.user_id)


@websocket_router.websocket("/ws/")
async def websocket_connect(websocket: WebSocket, token: str | None = None, db: Session = Depends(get_db)):
    if token is None:
        await websocket.close(code=1008)
        return

    try:
        current_user = get_user_from_token(token, db, "access")
    except HTTPException:
        await websocket.close(code=1008)
        return

    await manager.connect(current_user.id, websocket)

    try:
        while True:
            raw_message = await websocket.receive_text()

            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                continue

            action = message.get("action")
            topic = message.get("topic")

            if not isinstance(topic, str):
                continue

            if action == "subscribe" and can_subscribe_to_topic(topic, current_user, db):
                manager.subscribe(websocket, topic)

            if action == "unsubscribe":
                manager.unsubscribe(websocket, topic)
    except WebSocketDisconnect:
        manager.disconnect(current_user.id, websocket)
