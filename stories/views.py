from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from follows.models import Follow
from posts.models import Post
from profiles.models import Profile
from stories.models import Story, StoryView
from stories.schemas import StoryCreate
from users.permissions import can_view_content
from utils import get_dushanbe_time


def is_story_expired(story: Story):
    now = get_dushanbe_time()

    if story.expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)

    return story.expires_at <= now


def is_story_viewed(story_id: int, db: Session, user_id: int):
    return db.query(StoryView).filter(
        StoryView.story_id == story_id,
        StoryView.user_id == user_id,
    ).first() is not None


def get_story_user_data(story: Story):
    profile = story.user.profile if story.user else None

    return {
        "id": story.user_id,
        "username": profile.username if profile else "",
        "avatar_url": profile.avatar_url if profile else None,
    }


def get_story_data(story: Story, db: Session, current_user_id: int):
    return {
        "id": story.id,
        "user_id": story.user_id,
        "post_id": story.post_id,
        "media_url": story.media_url,
        "expires_at": story.expires_at,
        "views_count": story.views_count,
        "is_viewed": story.user_id == current_user_id or is_story_viewed(
            story.id,
            db,
            current_user_id,
        ),
        "created_at": story.created_at,
        "user": get_story_user_data(story),
    }


def get_stories_list_response(stories: list[Story], db: Session, current_user_id: int, limit: int, offset: int, has_next: bool):
    return {
        "stories": [
            get_story_data(story, db, current_user_id)
            for story in stories
        ],
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


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

    return get_story_data(new_story, db, user_id)


def get_story(story_id: int, db: Session, current_user_id: int):
    story = db.query(Story).filter(Story.id == story_id).first()

    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    if is_story_expired(story):
        raise HTTPException(status_code=404, detail="Story expired")

    if not can_view_content(db, current_user_id, story.user_id):
        raise HTTPException(status_code=403, detail="You cannot view this story")

    return get_story_data(story, db, current_user_id)


def get_user_stories(db: Session, user_id: int, limit: int = 20, offset: int = 0, current_user_id: int | None = None):
    current_user_id = current_user_id or user_id
    stories = db.query(Story).filter(
        Story.user_id == user_id,
        Story.expires_at > get_dushanbe_time(),
    ).order_by(Story.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(stories) > limit
    stories = stories[:limit]

    return get_stories_list_response(stories, db, current_user_id, limit, offset, has_next)


def get_following_ids(db: Session, user_id: int):
    return [
        following_id
        for (following_id,) in db.query(Follow.following_id).filter(
            Follow.follower_id == user_id,
            Follow.is_accepted == True,
        ).all()
    ]


def get_feed_stories(db: Session, user_id: int, limit: int = 50, offset: int = 0):
    feed_user_ids = get_following_ids(db, user_id)
    feed_user_ids.append(user_id)

    stories = db.query(Story).filter(
        Story.user_id.in_(feed_user_ids),
        Story.expires_at > get_dushanbe_time(),
    ).order_by(Story.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(stories) > limit
    stories = stories[:limit]

    return get_stories_list_response(stories, db, user_id, limit, offset, has_next)


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
        return get_story_data(story, db, user_id)

    new_view = StoryView(
        story_id=story_id,
        user_id=user_id,
    )

    story.views_count += 1

    db.add(new_view)
    db.commit()
    db.refresh(story)

    return get_story_data(story, db, user_id)


def get_story_viewers(story_id: int, db: Session, user_id: int, limit: int = 50, offset: int = 0):
    story = db.query(Story).filter(Story.id == story_id).first()

    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    if story.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can view only your story viewers")

    profiles = db.query(Profile).join(
        StoryView,
        StoryView.user_id == Profile.user_id,
    ).filter(
        StoryView.story_id == story_id,
    ).order_by(StoryView.created_at.desc()).offset(offset).limit(limit + 1).all()

    has_next = len(profiles) > limit
    profiles = profiles[:limit]

    return {
        "users": profiles,
        "limit": limit,
        "offset": offset,
        "has_next": has_next,
    }


def delete_story(story_id: int, db: Session, user_id: int):
    story = db.query(Story).filter(Story.id == story_id).first()

    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    if story.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can delete only your story")

    db.query(StoryView).filter(StoryView.story_id == story_id).delete(synchronize_session=False)
    db.delete(story)
    db.commit()
