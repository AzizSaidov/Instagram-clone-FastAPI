# Instagram Clone Backend

Учебный backend Instagram-like приложения на FastAPI.

## Stack

- FastAPI
- SQLAlchemy
- SQLite for development
- JWT auth
- WebSocket realtime
- File upload to local `media/`

Alembic, Docker and PostgreSQL are planned after the mobile frontend.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Media files are served from:

```text
http://127.0.0.1:8000/media/...
```

## Env

Use `.env.example` as a template:

```env
DATABASE_URL=sqlite:///./database.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=300
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Do not push `.env` or `database.db` to GitHub.

## Auth

Register creates `User` and `Profile`.

```text
POST /users/register/
POST /users/login/
POST /users/refresh/
PUT /users/change-password/
```

Login accepts phone number or username and returns access + refresh tokens.
Protected endpoints require:

```text
Authorization: Bearer <access_token>
```

## Main Modules

- `users` - register, login, JWT, password change
- `profiles` - profile page, edit profile, username search
- `posts` - post upload, post media, post views
- `reels` - reels upload, views, watched percent
- `stories` - story upload, share post to story, story views
- `comments` - comments for posts/reels
- `likes` - toggle likes for posts/reels/comments
- `follows` - follow, unfollow, private follow requests
- `blacklist` - block/unblock users
- `notifications` - likes/comments/follows notifications
- `notes` - 24h short notes
- `chats` - direct messages
- `groups` - group chats
- `realtime` - WebSocket manager

## Realtime

WebSocket endpoint:

```text
ws://127.0.0.1:8000/ws/?token=<access_token>
```

Events:

- `direct_message`
- `group_message`
- `notification`

## Development Notes

Current database is SQLite. If models/constraints changed and you want a clean dev database, stop the server and delete `database.db`; it will be recreated on next run.

You can also delete `__pycache__/` folders. They are ignored by Git.

Main technical docs and current project plan are in `tz.md`, but it is ignored by Git.
