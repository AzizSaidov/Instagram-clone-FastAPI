import asyncio

from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.connection_users: dict[WebSocket, int] = {}
        self.topic_connections: dict[str, list[WebSocket]] = {}
        self.connection_topics: dict[WebSocket, set[str]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        self.connection_users[websocket] = user_id

    def disconnect(self, user_id: int, websocket: WebSocket):
        connections = self.active_connections.get(user_id)

        if connections is not None:
            if websocket in connections:
                connections.remove(websocket)

            if not connections:
                self.active_connections.pop(user_id)

        self.connection_users.pop(websocket, None)
        self.unsubscribe_all(websocket)

    def subscribe(self, websocket: WebSocket, topic: str):
        connections = self.topic_connections.setdefault(topic, [])

        if websocket not in connections:
            connections.append(websocket)

        self.connection_topics.setdefault(websocket, set()).add(topic)

    def unsubscribe(self, websocket: WebSocket, topic: str):
        connections = self.topic_connections.get(topic)

        if connections and websocket in connections:
            connections.remove(websocket)

            if not connections:
                self.topic_connections.pop(topic, None)

        topics = self.connection_topics.get(websocket)

        if topics:
            topics.discard(topic)

            if not topics:
                self.connection_topics.pop(websocket, None)

    def unsubscribe_all(self, websocket: WebSocket):
        topics = list(self.connection_topics.get(websocket, set()))

        for topic in topics:
            self.unsubscribe(websocket, topic)

    async def send_to_user(self, user_id: int, data: dict):
        connections = self.active_connections.get(user_id, [])

        for websocket in list(connections):
            await self.send_to_websocket(websocket, data)

    async def send_to_users(self, user_ids: list[int], data: dict):
        for user_id in user_ids:
            await self.send_to_user(user_id, data)

    async def send_to_topic(self, topic: str, data: dict):
        connections = self.topic_connections.get(topic, [])

        for websocket in list(connections):
            await self.send_to_websocket(websocket, data)

    async def send_to_websocket(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except (RuntimeError, WebSocketDisconnect):
            user_id = self.connection_users.get(websocket)

            if user_id is not None:
                self.disconnect(user_id, websocket)
            else:
                self.unsubscribe_all(websocket)


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


def send_realtime_event_to_topic(topic: str, data: dict):
    if realtime_loop is None:
        return

    asyncio.run_coroutine_threadsafe(
        manager.send_to_topic(topic, data),
        realtime_loop,
    )
