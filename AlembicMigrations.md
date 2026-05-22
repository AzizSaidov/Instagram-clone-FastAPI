

## 1. We install Alembic

```bash
pip install alembic
```

## 2. We create the migrations folder

```bash
alembic init alembic
```

After this, we will see:

```text
alembic/
    versions/
    env.py
alembic.ini
```

## 3. We check `database.py`

Example:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./database.db"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
```

## 4. Example model

`models.py`

```python
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )
```

## 5. We configure `alembic.ini`

We find the line:

```ini
sqlalchemy.url = driver://user:pass@localhost/dbname
```

We replace it with:

```ini
sqlalchemy.url = sqlite:///./database.db
```

## 6. We configure `alembic/env.py`

At the top of the file we add:

```python
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import Base
import models
```

Then we find:

```python
target_metadata = None
```

We replace it with:

```python
target_metadata = Base.metadata
```

Inside `run_migrations_online()` we find `context.configure(...)` and make it look like this:

```python
context.configure(
    connection=connection,
    target_metadata=target_metadata,
    render_as_batch=True,
    compare_type=True
)
```

The useful part should look approximately like this:

```python
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()
```

`render_as_batch=True` is especially important for SQLite, because for some changes Alembic recreates the table using batch mode instead of a normal `ALTER TABLE`. ([Alembic][2])

## 7. We create the first migration

```bash
alembic revision --autogenerate -m "create users table"
```

After that, a file appears in:

```text
alembic/versions/
```

We open it and check that it contains something like:

```python
op.create_table(
    'users',
    ...
)
```

## 8. We apply the migration

```bash
alembic upgrade head
```

After this, the `users` table will be created in `database.db`.

## 9. If we changed the model

For example, added a new field:

```python
role: Mapped[str] = mapped_column(
    String(20),
    default="user"
)
```

We create a new migration:

```bash
alembic revision --autogenerate -m "add role to users"
```

We apply it:

```bash
alembic upgrade head
```

## Important

If the migration is generated empty, the problem is almost always here:

```python
import models
target_metadata = Base.metadata
```

That means Alembic does not see our models.

If we have multiple model files, for example:

```text
models/user.py
models/post.py
models/comment.py
```

then in `env.py` we need to import them all:

```python
from models import user, post, comment
```

or import one common file where they are all already imported.

The correct command to create a migration:

```bash
alembic revision --autogenerate -m "migration name"
```

The correct command to apply it:

```bash
alembic upgrade head
```

[1]: https://alembic.sqlalchemy.org/en/latest/autogenerate.html?utm_source=chatgpt.com "Auto Generating Migrations - Alembic's documentation!"
[2]: https://alembic.sqlalchemy.org/en/latest/batch.html?utm_source=chatgpt.com "Running “Batch” Migrations for SQLite and Other Databases"