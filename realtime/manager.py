import asyncio

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        connections = self.active_connections.get(user_id)

        if connections is None:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            self.active_connections.pop(user_id)

    async def send_to_user(self, user_id: int, data: dict):
        connections = self.active_connections.get(user_id, [])

        for websocket in connections:
            await websocket.send_json(data)

    async def send_to_users(self, user_ids: list[int], data: dict):
        for user_id in user_ids:
            await self.send_to_user(user_id, data)


manager = ConnectionManager()
realtime_loop = None


def set_realtime_loop(loop):
    global realtime_loop
    realtime_loop = loop


def send_realtime_event(user_id: int, data: dict):
    if realtime_loop is None:
        return

    asyncio.run_coroutine_threadsafe(
        manager.send_to_user(user_id, data),
        realtime_loop,
    )


def send_realtime_event_to_users(user_ids: list[int], data: dict):
    if realtime_loop is None:
        return

    asyncio.run_coroutine_threadsafe(
        manager.send_to_users(user_ids, data),
        realtime_loop,
    )
