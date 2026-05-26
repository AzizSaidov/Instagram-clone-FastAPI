from __future__ import annotations

import sys
from datetime import timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from chats.models import Chat, DirectMessage
from comments.models import Comment
from database import Base, SessionLocal, engine
from follows.models import Follow
from groups.models import Group, GroupMember, GroupMessage
from likes.models import Like
from notes.models import Note
from notifications.models import Notification
from posts.models import Post, PostMedia, PostView
from profiles.models import Profile
from reels.models import Reel, ReelView
from saved.models import SavedPost
from stories.models import Story, StoryView
from users.auth import hash_password
from users.models import User
from utils import get_dushanbe_time


PASSWORD = "Social2026!"
CLEANUP_PREFIXES = ("demo_", "codex")

PLACEHOLDER_PROFILE_OVERRIDES = {
    "noname": {
        "username": "aziz.saidov",
        "fallback_username": "aziz.daily",
        "full_name": "Aziz Saidov",
        "bio": "Quiet interiors, short reels, and saved city corners.",
        "avatar": "https://i.pravatar.cc/180?img=68",
        "note": "Editing today",
    },
    "noname2": {
        "username": "laylo.design",
        "fallback_username": "laylo.photos",
        "full_name": "Laylo Design",
        "bio": "Photos, coffee stops, and weekend plans.",
        "avatar": "https://i.pravatar.cc/180?img=19",
        "note": "Studio later",
    },
}

PEOPLE = [
    {
        "username": "amelia.hart",
        "phone_number": "+1555010201",
        "full_name": "Amelia Hart",
        "bio": "Coffee walks, small rooms, and weekend frames.",
        "avatar": "https://i.pravatar.cc/180?img=47",
    },
    {
        "username": "oliver.stone",
        "phone_number": "+1555010202",
        "full_name": "Oliver Stone",
        "bio": "Street photos and short motion edits.",
        "avatar": "https://i.pravatar.cc/180?img=12",
    },
    {
        "username": "mia.carter",
        "phone_number": "+1555010203",
        "full_name": "Mia Carter",
        "bio": "Interior details, plants, light.",
        "avatar": "https://i.pravatar.cc/180?img=32",
    },
    {
        "username": "noah.bennett",
        "phone_number": "+1555010204",
        "full_name": "Noah Bennett",
        "bio": "City corners, food stops, train windows.",
        "avatar": "https://i.pravatar.cc/180?img=15",
    },
    {
        "username": "sophia.reed",
        "phone_number": "+1555010205",
        "full_name": "Sophia Reed",
        "bio": "Design notes and places worth saving.",
        "avatar": "https://i.pravatar.cc/180?img=26",
    },
    {
        "username": "ethan.miles",
        "phone_number": "+1555010206",
        "full_name": "Ethan Miles",
        "bio": "Weekend hikes and quiet videos.",
        "avatar": "https://i.pravatar.cc/180?img=59",
    },
]

IMAGE_URLS = [
    "https://picsum.photos/seed/cafe-light-2026/1080/1080",
    "https://picsum.photos/seed/studio-desk-2026/1080/1080",
    "https://picsum.photos/seed/city-evening-2026/1080/1080",
    "https://picsum.photos/seed/interior-green-2026/1080/1080",
    "https://picsum.photos/seed/weekend-road-2026/1080/1080",
    "https://picsum.photos/seed/gallery-corner-2026/1080/1080",
    "https://picsum.photos/seed/coffee-window-2026/1080/1080",
    "https://picsum.photos/seed/minimal-room-2026/1080/1080",
    "https://picsum.photos/seed/night-street-2026/1080/1080",
    "https://picsum.photos/seed/brunch-table-2026/1080/1080",
]

VIDEO_URLS = [
    "https://media.w3.org/2010/05/bunny/trailer.mp4",
    "https://media.w3.org/2010/05/sintel/trailer.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
]

POSTS = [
    ("Morning coffee before the city wakes up.", "#coffee #morning #citylife"),
    ("A quiet desk setup that actually stayed clean for five minutes.", "#workspace #design #minimal"),
    ("Late walk, soft lights, no rush.", "#streetphotography #evening"),
    ("Plants make every corner feel warmer.", "#interior #plants #home"),
    ("Small road trip, big sky.", "#weekend #travel #outdoors"),
    ("Saved this color palette for later.", "#inspiration #gallery #palette"),
    ("Window seat and a second espresso.", "#cafe #slowmorning"),
    ("Clean lines, warm light, good mood.", "#interiordesign #homestyle"),
    ("The best streets are the ones you find by accident.", "#nightwalk #city"),
    ("Brunch table looked too good not to post.", "#brunch #food #friends"),
]

REELS = [
    ("Tiny motion diary from the weekend.", "#reels #weekend"),
    ("A few seconds of city noise.", "#streetvideo #city"),
    ("Slow morning, quick edit.", "#morningroutine #shortvideo"),
]

OWN_POST = (
    "A clean corner that finally felt finished.",
    "#home #interiordetails #softlight",
)
OWN_REEL = (
    "A few seconds from the evening walk.",
    "#eveningwalk #reels",
)
OWN_POST_VARIANTS = [
    ("A clean corner that finally felt finished.", "#home #interiordetails #softlight", [7, 3]),
    ("Late afternoon edits and a quiet room.", "#editing #workspace #softlight", [1, 5]),
    ("Coffee, notes, and a small reset.", "#coffee #dailyphoto #slowday", [9, 0]),
    ("A city walk saved for later.", "#citywalk #photojournal #evening", [2, 8]),
]
OWN_REEL_VARIANTS = [
    ("A few seconds from the evening walk.", "#eveningwalk #reels", 1),
    ("Quick desk reset before posting.", "#desksetup #shortvideo", 2),
    ("Tiny city motion diary.", "#city #reels", 0),
]
GROUP_NAMES = [
    "Weekend Plans",
    "Studio Notes",
    "Coffee Walks",
    "Photo Club",
    "City Edits",
    "Travel Ideas",
]


def get_owned_content_ids(db, user_ids: list[int]) -> tuple[list[int], list[int], list[int], list[int], list[int], list[int]]:
    post_ids = [post_id for (post_id,) in db.query(Post.id).filter(Post.user_id.in_(user_ids)).all()]
    reel_ids = [reel_id for (reel_id,) in db.query(Reel.id).filter(Reel.user_id.in_(user_ids)).all()]
    story_ids = [story_id for (story_id,) in db.query(Story.id).filter(Story.user_id.in_(user_ids)).all()]
    comment_ids = [
        comment_id
        for (comment_id,) in db.query(Comment.id).filter(
            (Comment.user_id.in_(user_ids)) |
            (Comment.post_id.in_(post_ids) if post_ids else False) |
            (Comment.reels_id.in_(reel_ids) if reel_ids else False)
        ).all()
    ]
    group_ids = [group_id for (group_id,) in db.query(Group.id).filter(Group.owner_id.in_(user_ids)).all()]
    chat_ids = [
        chat_id
        for (chat_id,) in db.query(Chat.id).filter(
            (Chat.user_id_1.in_(user_ids)) |
            (Chat.user_id_2.in_(user_ids))
        ).all()
    ]

    return post_ids, reel_ids, story_ids, comment_ids, group_ids, chat_ids


def cleanup_activity_for_users(db, user_ids: list[int], delete_accounts: bool) -> None:
    if not user_ids:
        return

    post_ids, reel_ids, story_ids, comment_ids, group_ids, chat_ids = get_owned_content_ids(db, user_ids)

    db.query(Notification).filter(
        (Notification.to_user_id.in_(user_ids)) |
        (Notification.from_user_id.in_(user_ids)) |
        (Notification.post_id.in_(post_ids) if post_ids else False) |
        (Notification.reels_id.in_(reel_ids) if reel_ids else False) |
        (Notification.comment_id.in_(comment_ids) if comment_ids else False)
    ).delete(synchronize_session=False)

    if comment_ids:
        db.query(Like).filter(Like.comment_id.in_(comment_ids)).delete(synchronize_session=False)
    if post_ids:
        db.query(SavedPost).filter(SavedPost.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(Like).filter(Like.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(PostView).filter(PostView.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(PostMedia).filter(PostMedia.post_id.in_(post_ids)).delete(synchronize_session=False)
    if reel_ids:
        db.query(Like).filter(Like.reels_id.in_(reel_ids)).delete(synchronize_session=False)
        db.query(ReelView).filter(ReelView.reels_id.in_(reel_ids)).delete(synchronize_session=False)
    if story_ids:
        db.query(StoryView).filter(StoryView.story_id.in_(story_ids)).delete(synchronize_session=False)
    if comment_ids:
        db.query(Comment).filter(Comment.id.in_(comment_ids)).delete(synchronize_session=False)
    if chat_ids:
        db.query(DirectMessage).filter(DirectMessage.chat_id.in_(chat_ids)).delete(synchronize_session=False)
        db.query(Chat).filter(Chat.id.in_(chat_ids)).delete(synchronize_session=False)
    if group_ids:
        db.query(GroupMessage).filter(GroupMessage.group_id.in_(group_ids)).delete(synchronize_session=False)
        db.query(GroupMember).filter(GroupMember.group_id.in_(group_ids)).delete(synchronize_session=False)
        db.query(Group).filter(Group.id.in_(group_ids)).delete(synchronize_session=False)

    db.query(DirectMessage).filter(DirectMessage.sender_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(GroupMessage).filter(GroupMessage.sender_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(GroupMember).filter(GroupMember.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(SavedPost).filter(SavedPost.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Like).filter(Like.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(StoryView).filter(StoryView.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(ReelView).filter(ReelView.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(PostView).filter(PostView.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Follow).filter(
        (Follow.follower_id.in_(user_ids)) |
        (Follow.following_id.in_(user_ids))
    ).delete(synchronize_session=False)
    db.query(Note).filter(Note.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Story).filter(Story.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Reel).filter(Reel.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Post).filter(Post.user_id.in_(user_ids)).delete(synchronize_session=False)

    if delete_accounts:
        db.query(Profile).filter(Profile.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)


def cleanup_old_test_data(db) -> None:
    profiles = db.query(Profile).filter(
        Profile.username.like("demo_%") |
        Profile.username.like("codex%")
    ).all()
    user_ids = [profile.user_id for profile in profiles]

    cleanup_activity_for_users(db, user_ids, delete_accounts=True)


def get_or_create_user(db, person: dict) -> User:
    profile = db.query(Profile).filter(Profile.username == person["username"]).first()

    if profile:
        user = db.query(User).filter(User.id == profile.user_id).first()
        profile.full_name = person["full_name"]
        profile.bio = person["bio"]
        profile.avatar_url = person["avatar"]
        profile.is_private = False
        return user

    user = User(
        phone_number=person["phone_number"],
        hashed_password=hash_password(PASSWORD),
    )
    db.add(user)
    db.flush()

    user.profile = Profile(
        user_id=user.id,
        username=person["username"],
        full_name=person["full_name"],
        bio=person["bio"],
        avatar_url=person["avatar"],
        is_private=False,
    )
    db.add(user.profile)
    db.flush()

    return user


def polish_placeholder_profiles(db) -> list[User]:
    profiles = db.query(Profile).filter(Profile.username.in_(PLACEHOLDER_PROFILE_OVERRIDES.keys())).all()
    user_ids = [profile.user_id for profile in profiles]
    cleanup_activity_for_users(db, user_ids, delete_accounts=False)

    polished_users = []
    for profile in profiles:
        override = PLACEHOLDER_PROFILE_OVERRIDES[profile.username]
        target_username = override["username"]
        existing_target = db.query(Profile).filter(Profile.username == target_username).first()

        if existing_target is not None and existing_target.user_id != profile.user_id:
            fallback_username = override.get("fallback_username", f"{target_username}.{profile.user_id}")
            fallback_target = db.query(Profile).filter(Profile.username == fallback_username).first()
            target_username = fallback_username if fallback_target is None else f"{fallback_username}.{profile.user_id}"

        profile.username = target_username

        profile.full_name = override["full_name"]
        profile.bio = override["bio"]
        profile.avatar_url = override["avatar"]

        user = db.query(User).filter(User.id == profile.user_id).first()
        if user:
            polished_users.append(user)
            ensure_note(db, user, override["note"])

    db.flush()
    return polished_users


def ensure_follow(db, follower: User, following: User, accepted: bool = True) -> None:
    if follower.id == following.id:
        return

    follow = db.query(Follow).filter(
        Follow.follower_id == follower.id,
        Follow.following_id == following.id,
    ).first()

    if follow is None:
        db.add(Follow(follower_id=follower.id, following_id=following.id, is_accepted=accepted))
    else:
        follow.is_accepted = accepted


def ensure_post(db, user: User, description: str, hashtag: str, media_items: list[str]) -> Post:
    post = db.query(Post).filter(
        Post.user_id == user.id,
        Post.description == description,
    ).first()

    if post is None:
        post = Post(user_id=user.id, description=description, hashtag=hashtag, views_count=0)
        db.add(post)
        db.flush()
        for index, item in enumerate(media_items):
            db.add(PostMedia(post_id=post.id, media_url=item, order_index=index))
    else:
        post.hashtag = hashtag

    return post


def ensure_reel(db, user: User, description: str, hashtag: str, video_url: str) -> Reel:
    reel = db.query(Reel).filter(
        Reel.user_id == user.id,
        Reel.description == description,
    ).first()

    if reel is None:
        reel = Reel(user_id=user.id, video_url=video_url, description=description, hashtag=hashtag)
        db.add(reel)
    else:
        reel.video_url = video_url
        reel.hashtag = hashtag

    return reel


def ensure_context_post(db, user: User) -> Post:
    description, hashtag, media_indexes = OWN_POST_VARIANTS[user.id % len(OWN_POST_VARIANTS)]
    media_items = [IMAGE_URLS[index] for index in media_indexes]
    legacy_post = db.query(Post).filter(
        Post.user_id == user.id,
        Post.description == OWN_POST[0],
    ).first()

    if legacy_post and legacy_post.description != description:
        legacy_post.description = description
        legacy_post.hashtag = hashtag
        db.query(PostMedia).filter(PostMedia.post_id == legacy_post.id).delete(synchronize_session=False)
        db.flush()
        for index, item in enumerate(media_items):
            db.add(PostMedia(post_id=legacy_post.id, media_url=item, order_index=index))

        return legacy_post

    return ensure_post(db, user, description, hashtag, media_items)


def ensure_context_reel(db, user: User) -> Reel:
    description, hashtag, video_index = OWN_REEL_VARIANTS[user.id % len(OWN_REEL_VARIANTS)]
    video_url = VIDEO_URLS[video_index]
    legacy_reel = db.query(Reel).filter(
        Reel.user_id == user.id,
        Reel.description == OWN_REEL[0],
    ).first()

    if legacy_reel and legacy_reel.description != description:
        legacy_reel.description = description
        legacy_reel.hashtag = hashtag
        legacy_reel.video_url = video_url
        return legacy_reel

    return ensure_reel(db, user, description, hashtag, video_url)


def ensure_story(db, user: User, media_url: str) -> None:
    story = db.query(Story).filter(Story.user_id == user.id, Story.media_url == media_url).first()
    expires_at = get_dushanbe_time() + timedelta(hours=24)

    if story is None:
        db.add(Story(user_id=user.id, media_url=media_url, expires_at=expires_at))
    else:
        story.expires_at = expires_at


def ensure_note(db, user: User, text: str) -> None:
    note = db.query(Note).filter(Note.user_id == user.id, Note.text == text).first()
    if note is None:
        db.add(Note(user_id=user.id, text=text, expires_at=get_dushanbe_time() + timedelta(hours=24)))


def ensure_comment(db, user: User, text: str, post: Post | None = None, reel: Reel | None = None) -> Comment:
    comment = db.query(Comment).filter(
        Comment.user_id == user.id,
        Comment.text == text,
        Comment.post_id == (post.id if post else None),
        Comment.reels_id == (reel.id if reel else None),
    ).first()

    if comment is None:
        comment = Comment(
            user_id=user.id,
            text=text,
            post_id=post.id if post else None,
            reels_id=reel.id if reel else None,
        )
        db.add(comment)
        db.flush()

    return comment


def ensure_like(db, user: User, post: Post | None = None, reel: Reel | None = None, comment: Comment | None = None) -> None:
    query = db.query(Like).filter(Like.user_id == user.id)
    if post is not None:
        query = query.filter(Like.post_id == post.id)
    elif reel is not None:
        query = query.filter(Like.reels_id == reel.id)
    elif comment is not None:
        query = query.filter(Like.comment_id == comment.id)
    else:
        return

    if query.first() is None:
        db.add(
            Like(
                user_id=user.id,
                post_id=post.id if post else None,
                reels_id=reel.id if reel else None,
                comment_id=comment.id if comment else None,
            )
        )


def ensure_post_view(db, user: User, post: Post) -> None:
    if user.id == post.user_id:
        return

    view = db.query(PostView).filter(PostView.user_id == user.id, PostView.post_id == post.id).first()
    if view is None:
        db.add(PostView(user_id=user.id, post_id=post.id))
        post.views_count += 1


def ensure_reel_view(db, user: User, reel: Reel) -> None:
    if user.id == reel.user_id:
        return

    view = db.query(ReelView).filter(ReelView.user_id == user.id, ReelView.reels_id == reel.id).first()
    if view is None:
        db.add(ReelView(user_id=user.id, reels_id=reel.id, watched_percent=80))
        reel.views_count += 1


def ensure_story_view(db, user: User, story: Story) -> None:
    if user.id == story.user_id:
        return

    view = db.query(StoryView).filter(StoryView.user_id == user.id, StoryView.story_id == story.id).first()
    if view is None:
        db.add(StoryView(user_id=user.id, story_id=story.id))
        story.views_count += 1


def ensure_chat(db, user_a: User, user_b: User) -> Chat:
    first_id, second_id = sorted([user_a.id, user_b.id])
    chat = db.query(Chat).filter(Chat.user_id_1 == first_id, Chat.user_id_2 == second_id).first()
    if chat is None:
        chat = Chat(user_id_1=first_id, user_id_2=second_id)
        db.add(chat)
        db.flush()
    return chat


def ensure_message(db, chat: Chat, sender: User, text: str) -> None:
    exists = db.query(DirectMessage).filter(
        DirectMessage.chat_id == chat.id,
        DirectMessage.sender_id == sender.id,
        DirectMessage.text == text,
    ).first()
    if exists is None:
        db.add(DirectMessage(chat_id=chat.id, sender_id=sender.id, text=text))


def ensure_group(db, owner: User, users: list[User]) -> None:
    group_name = GROUP_NAMES[owner.id % len(GROUP_NAMES)]
    group = db.query(Group).filter(
        Group.owner_id == owner.id,
        Group.name.in_(GROUP_NAMES + ["Weekend Plans"]),
    ).first()
    if group is None:
        group = Group(owner_id=owner.id, name=group_name)
        db.add(group)
        db.flush()
    else:
        group.name = group_name

    for user in users:
        member = db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user.id).first()
        if member is None:
            db.add(GroupMember(group_id=group.id, user_id=user.id))

    exists = db.query(GroupMessage).filter(GroupMessage.group_id == group.id, GroupMessage.text == "Saturday coffee first, then the gallery?").first()
    if exists is None:
        db.add(GroupMessage(group_id=group.id, sender_id=owner.id, text="Saturday coffee first, then the gallery?"))


def seed_existing_user_context(db, existing: User, users: list[User]) -> None:
    for user in users[:4]:
        ensure_follow(db, existing, user)
        ensure_follow(db, user, existing)

    post = ensure_context_post(db, existing)
    reel = ensure_context_reel(db, existing)
    ensure_story(db, existing, IMAGE_URLS[(existing.id + 4) % len(IMAGE_URLS)])
    db.flush()

    story = db.query(Story).filter(
        Story.user_id == existing.id,
        Story.media_url == IMAGE_URLS[(existing.id + 4) % len(IMAGE_URLS)],
    ).first()

    for viewer in users[:5]:
        ensure_like(db, viewer, post=post)
        ensure_like(db, viewer, reel=reel)
        ensure_post_view(db, viewer, post)
        ensure_reel_view(db, viewer, reel)
        if story:
            ensure_story_view(db, viewer, story)

    ensure_comment(db, users[0], "This looks calm and real.", post=post)
    ensure_comment(db, users[1], "Save-worthy corner.", post=post)
    ensure_comment(db, users[2], "Love the pacing here.", reel=reel)

    chat = ensure_chat(db, existing, users[0])
    ensure_message(db, chat, users[0], "That new post looks great.")
    ensure_message(db, chat, existing, "Thanks, testing the app with real content now.")

    ensure_group(db, existing, [existing, users[0], users[1], users[2]])


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        cleanup_old_test_data(db)
        polish_placeholder_profiles(db)

        users = [get_or_create_user(db, person) for person in PEOPLE]
        db.flush()
        seed_usernames = {person["username"] for person in PEOPLE}

        for index, user in enumerate(users):
            ensure_note(db, user, ["Out for coffee", "New edit soon", "Studio day", "On the train", "Saving ideas", "Trail morning"][index])
            for other in users:
                if other.id != user.id and (other.id + user.id) % 2 == 0:
                    ensure_follow(db, user, other)

        for existing in db.query(User).all():
            if existing.profile and existing.profile.username not in seed_usernames:
                seed_existing_user_context(db, existing, users)

        posts = []
        for index, (description, hashtag) in enumerate(POSTS):
            owner = users[index % len(users)]
            media_items = [IMAGE_URLS[index % len(IMAGE_URLS)]]
            if index % 4 == 1:
                media_items.append(IMAGE_URLS[(index + 1) % len(IMAGE_URLS)])
            posts.append(ensure_post(db, owner, description, hashtag, media_items))

        reels = [
            ensure_reel(db, users[(index + 1) % len(users)], description, hashtag, VIDEO_URLS[index % len(VIDEO_URLS)])
            for index, (description, hashtag) in enumerate(REELS)
        ]
        db.flush()

        for index, user in enumerate(users):
            ensure_story(db, user, IMAGE_URLS[(index + 4) % len(IMAGE_URLS)])

        for index, post in enumerate(posts):
            commenter = users[(index + 1) % len(users)]
            comment = ensure_comment(db, commenter, "This frame feels so good.", post=post)
            for liker in users:
                if liker.id != post.user_id:
                    ensure_like(db, liker, post=post)
            ensure_like(db, users[(index + 2) % len(users)], comment=comment)

        for index, reel in enumerate(reels):
            ensure_comment(db, users[index], "Love this clip.", reel=reel)
            for liker in users[:4]:
                if liker.id != reel.user_id:
                    ensure_like(db, liker, reel=reel)

        chat = ensure_chat(db, users[0], users[1])
        ensure_message(db, chat, users[0], "That cafe photo is perfect.")
        ensure_message(db, chat, users[1], "Thanks, posting a reel later.")
        ensure_group(db, users[2], users[:4])

        db.commit()
        print(f"Realistic seed complete. Password for seeded users: {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
