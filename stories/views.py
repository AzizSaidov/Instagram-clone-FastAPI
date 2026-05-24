from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from posts.models import Post
from stories.models import Story, StoryView
from stories.schemas import StoryCreate
from users.permissions import can_view_content
from utils import get_dushanbe_time


def is_story_expired(story: Story):
    now = get_dushanbe_time()

    if story.expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)

    return story.expires_at <= now


def create_story(data: StoryCreate, db: Session, user_id: int):
    if data.post_id is not None:
        post = db.query(Post).filter(Post.id == data.post_id).first()

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        if not can_view_content(db, user_id, post.user_id):
            raise HTTPException(status_code=403, detail="You cannot share this post")

    new_story = Story(
        user_id=user_id,
        post_id=data.post_id,
        media_url=data.media_url,
        expires_at=get_dushanbe_time() + timedelta(hours=24),
    )

    db.add(new_story)
    db.commit()
    db.refresh(new_story)

    return new_story


def get_story(story_id: int, db: Session, current_user_id: int):
    story = db.query(Story).filter(Story.id == story_id).first()

    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    if is_story_expired(story):
        raise HTTPException(status_code=404, detail="Story expired")

    if not can_view_content(db, current_user_id, story.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this story")

    return story


def get_user_stories(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    stories = db.query(Story).filter(
        Story.user_id == user_id,
        Story.expires_at > get_dushanbe_time(),
    ).order_by(Story.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(stories) > limit
    stories = stories[:limit]

    return {
        "stories": stories,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def create_story_view(story_id: int, db: Session, user_id: int):
    story = db.query(Story).filter(Story.id == story_id).first()

    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    if is_story_expired(story):
        raise HTTPException(status_code=404, detail="Story expired")

    if not can_view_content(db, user_id, story.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this story")

    existing_view = db.query(StoryView).filter(StoryView.story_id == story_id, StoryView.user_id == user_id).first()

    if existing_view:
        return story

    new_view = StoryView(
        story_id=story_id,
        user_id=user_id,
    )

    story.views_count += 1

    db.add(new_view)
    db.commit()
    db.refresh(story)

    return story
