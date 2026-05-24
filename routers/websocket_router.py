from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from database import get_db
from realtime.manager import manager
from users.auth import get_user_from_token


websocket_router = APIRouter(tags=["WebSocket"])


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
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(current_user.id, websocket)
