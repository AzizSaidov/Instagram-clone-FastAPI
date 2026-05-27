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
from saved.models import SavedPost, SavedReel
from stories.models import Story, StoryView
from users.auth import hash_password
from users.models import User
from utils import get_dushanbe_time


PASSWORD = "Social2026!"
SEED_PHONE_PREFIX = "+155509"
LEGACY_SEED_PHONE_NUMBERS = tuple(f"+155501020{index}" for index in range(1, 7))

PEOPLE = [
    {
        "username": "amelia.hart",
        "phone_number": "+1555090001",
        "full_name": "Amelia Hart",
        "bio": "Coffee walks, small rooms, and weekend frames.",
        "avatar": "https://i.pravatar.cc/180?img=47",
        "note": "Coffee walk",
    },
    {
        "username": "oliver.stone",
        "phone_number": "+1555090002",
        "full_name": "Oliver Stone",
        "bio": "Street photos and short motion edits.",
        "avatar": "https://i.pravatar.cc/180?img=12",
        "note": "New cut soon",
    },
    {
        "username": "mia.carter",
        "phone_number": "+1555090003",
        "full_name": "Mia Carter",
        "bio": "Interior details, plants, light.",
        "avatar": "https://i.pravatar.cc/180?img=32",
        "note": "Studio day",
    },
    {
        "username": "noah.bennett",
        "phone_number": "+1555090004",
        "full_name": "Noah Bennett",
        "bio": "City corners, food stops, train windows.",
        "avatar": "https://i.pravatar.cc/180?img=15",
        "note": "On the train",
    },
    {
        "username": "sophia.reed",
        "phone_number": "+1555090005",
        "full_name": "Sophia Reed",
        "bio": "Design notes and places worth saving.",
        "avatar": "https://i.pravatar.cc/180?img=26",
        "note": "Saving ideas",
        "is_private": True,
    },
    {
        "username": "ethan.miles",
        "phone_number": "+1555090006",
        "full_name": "Ethan Miles",
        "bio": "Weekend hikes and quiet videos.",
        "avatar": "https://i.pravatar.cc/180?img=59",
        "note": "Trail morning",
    },
    {
        "username": "harper.lane",
        "phone_number": "+1555090007",
        "full_name": "Harper Lane",
        "bio": "Film scans, recipes, and slow weekends.",
        "avatar": "https://i.pravatar.cc/180?img=5",
        "note": "Film roll",
    },
    {
        "username": "lucas.gray",
        "phone_number": "+1555090008",
        "full_name": "Lucas Gray",
        "bio": "Architecture, shadows, and city grids.",
        "avatar": "https://i.pravatar.cc/180?img=53",
        "note": "Late walk",
    },
    {
        "username": "ava.wilson",
        "phone_number": "+1555090009",
        "full_name": "Ava Wilson",
        "bio": "Tables, flowers, markets, and daily color.",
        "avatar": "https://i.pravatar.cc/180?img=44",
        "note": "Market run",
    },
    {
        "username": "liam.parker",
        "phone_number": "+1555090010",
        "full_name": "Liam Parker",
        "bio": "Outdoor notes and tiny travel reels.",
        "avatar": "https://i.pravatar.cc/180?img=60",
        "note": "Packing light",
    },
    {
        "username": "ella.brooks",
        "phone_number": "+1555090011",
        "full_name": "Ella Brooks",
        "bio": "Muted palettes, galleries, and good coffee.",
        "avatar": "https://i.pravatar.cc/180?img=29",
        "note": "Gallery later",
    },
    {
        "username": "james.foster",
        "phone_number": "+1555090012",
        "full_name": "James Foster",
        "bio": "Short clips from long walks.",
        "avatar": "https://i.pravatar.cc/180?img=8",
        "note": "Route saved",
        "is_private": True,
    },
    {
        "username": "grace.evans",
        "phone_number": "+1555090013",
        "full_name": "Grace Evans",
        "bio": "Books, brunch, and city mornings.",
        "avatar": "https://i.pravatar.cc/180?img=49",
        "note": "Brunch table",
    },
    {
        "username": "henry.cooper",
        "phone_number": "+1555090014",
        "full_name": "Henry Cooper",
        "bio": "Night streets and soft neon.",
        "avatar": "https://i.pravatar.cc/180?img=14",
        "note": "Night edit",
    },
    {
        "username": "chloe.price",
        "phone_number": "+1555090015",
        "full_name": "Chloe Price",
        "bio": "Plants, kitchens, and weekend hosting.",
        "avatar": "https://i.pravatar.cc/180?img=38",
        "note": "Hosting soon",
    },
    {
        "username": "mason.rivera",
        "phone_number": "+1555090016",
        "full_name": "Mason Rivera",
        "bio": "Train rides, sketches, and everyday scenes.",
        "avatar": "https://i.pravatar.cc/180?img=52",
        "note": "Sketch break",
    },
    {
        "username": "lily.hughes",
        "phone_number": "+1555090017",
        "full_name": "Lily Hughes",
        "bio": "Light, linen, and quiet homes.",
        "avatar": "https://i.pravatar.cc/180?img=23",
        "note": "Soft light",
    },
    {
        "username": "ben.walker",
        "phone_number": "+1555090018",
        "full_name": "Ben Walker",
        "bio": "Food stops and tiny travel guides.",
        "avatar": "https://i.pravatar.cc/180?img=61",
        "note": "Food map",
        "is_private": True,
    },
    {
        "username": "nora.kelly",
        "phone_number": "+1555090019",
        "full_name": "Nora Kelly",
        "bio": "Ceramics, windows, and quiet tables.",
        "avatar": "https://i.pravatar.cc/180?img=41",
        "note": "Clay day",
    },
    {
        "username": "owen.king",
        "phone_number": "+1555090020",
        "full_name": "Owen King",
        "bio": "Skate clips and wide streets.",
        "avatar": "https://i.pravatar.cc/180?img=11",
        "note": "Skate spot",
    },
    {
        "username": "zoe.morgan",
        "phone_number": "+1555090021",
        "full_name": "Zoe Morgan",
        "bio": "Bookstores, posters, and corner seats.",
        "avatar": "https://i.pravatar.cc/180?img=31",
        "note": "Book hunt",
    },
    {
        "username": "leo.bailey",
        "phone_number": "+1555090022",
        "full_name": "Leo Bailey",
        "bio": "Tiny kitchens and lunch videos.",
        "avatar": "https://i.pravatar.cc/180?img=17",
        "note": "Lunch edit",
    },
    {
        "username": "ruby.scott",
        "phone_number": "+1555090023",
        "full_name": "Ruby Scott",
        "bio": "Flowers, fabric, and soft color.",
        "avatar": "https://i.pravatar.cc/180?img=36",
        "note": "Color test",
    },
    {
        "username": "theo.ward",
        "phone_number": "+1555090024",
        "full_name": "Theo Ward",
        "bio": "Museum days and long walks.",
        "avatar": "https://i.pravatar.cc/180?img=56",
        "note": "Museum day",
    },
]

SEED_USERNAMES = {person["username"] for person in PEOPLE}

IMAGE_URLS = [
    f"https://picsum.photos/seed/instagram-web-seed-{index:02d}/1080/1080"
    for index in range(1, 141)
]

VIDEO_URLS = [
    "https://media.w3.org/2010/05/bunny/trailer.mp4",
    "https://media.w3.org/2010/05/sintel/trailer.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    "https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4",
    "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
    "https://samplelib.com/lib/preview/mp4/sample-30s.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
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
    ("A corner table, two notebooks, and a perfect playlist.", "#dailyphoto #notes"),
    ("Market flowers that changed the whole room.", "#flowers #market #color"),
    ("Train window light made everything cinematic.", "#travel #train #light"),
    ("A small gallery wall with a very patient friend.", "#art #weekend"),
    ("Kitchen reset before everyone arrives.", "#home #hosting"),
    ("Sketches from a slow afternoon.", "#sketchbook #creative"),
    ("Muted linen and the softest morning light.", "#homedecor #softlight"),
    ("A food map disguised as a weekend walk.", "#foodspots #cityguide"),
]

REELS = [
    ("Tiny motion diary from the weekend.", "#reels #weekend"),
    ("A few seconds of city noise.", "#streetvideo #city"),
    ("Slow morning, quick edit.", "#morningroutine #shortvideo"),
    ("Coffee steam and a window seat.", "#cafevideo #daily"),
    ("Gallery hallway in three quick cuts.", "#gallery #motion"),
    ("A road clip from the best part of the drive.", "#travelreel #outdoors"),
    ("Market color in motion.", "#market #colorstory"),
    ("Night lights before heading home.", "#nightreel #city"),
    ("Desk reset in under ten seconds.", "#workspace #reset"),
    ("Train ride, soft focus.", "#train #travelvideo"),
]

COMMENT_TEXTS = [
    "This frame feels so good.",
    "The colors are perfect here.",
    "Saving this for later.",
    "Love the pacing.",
    "This looks calm and real.",
    "That light is doing all the work.",
    "Such a good little moment.",
    "Need this on my weekend list.",
]

DIRECT_THREADS = [
    (0, 1, ["That cafe photo is perfect.", "Thanks, posting a reel later."]),
    (2, 4, ["Can you send the palette from today?", "Yes, I saved three options."]),
    (5, 9, ["Trail looked peaceful.", "It was quiet until the wind picked up."]),
    (7, 13, ["Night edits are getting better.", "The neon helped a lot."]),
    (8, 14, ["Market flowers tomorrow?", "Absolutely, early is best."]),
    (10, 12, ["Gallery first or brunch first?", "Gallery, then brunch."]),
]

GROUPS = [
    {
        "owner": 2,
        "name": "Studio Notes",
        "avatar": IMAGE_URLS[4],
        "members": [2, 4, 10, 16],
        "messages": [
            "I added the new palette to the board.",
            "Looks warmer already.",
        ],
    },
    {
        "owner": 3,
        "name": "Coffee Walks",
        "avatar": IMAGE_URLS[10],
        "members": [0, 1, 3, 6, 12],
        "messages": [
            "Saturday coffee first, then the gallery?",
            "Perfect, I will bring the camera.",
        ],
    },
    {
        "owner": 9,
        "name": "Travel Ideas",
        "avatar": IMAGE_URLS[17],
        "members": [5, 9, 11, 15, 17],
        "messages": [
            "Road trip folder is ready.",
            "Add the train route too.",
        ],
    },
    {
        "owner": 13,
        "name": "Night Edits",
        "avatar": IMAGE_URLS[25],
        "members": [1, 7, 13, 15],
        "messages": [
            "The neon reel needs one more cut.",
            "Try the slower opening.",
        ],
    },
]


def get_owned_content_ids(
    db,
    user_ids: list[int],
) -> tuple[list[int], list[int], list[int], list[int], list[int], list[int]]:
    post_ids = [
        post_id
        for (post_id,) in db.query(Post.id).filter(Post.user_id.in_(user_ids)).all()
    ]
    reel_ids = [
        reel_id
        for (reel_id,) in db.query(Reel.id).filter(Reel.user_id.in_(user_ids)).all()
    ]
    story_ids = [
        story_id
        for (story_id,) in db.query(Story.id).filter(Story.user_id.in_(user_ids)).all()
    ]
    comment_ids = [
        comment_id
        for (comment_id,) in db.query(Comment.id).filter(
            (Comment.user_id.in_(user_ids))
            | (Comment.post_id.in_(post_ids) if post_ids else False)
            | (Comment.reels_id.in_(reel_ids) if reel_ids else False),
        ).all()
    ]
    group_ids = [
        group_id
        for (group_id,) in db.query(Group.id).filter(Group.owner_id.in_(user_ids)).all()
    ]
    chat_ids = [
        chat_id
        for (chat_id,) in db.query(Chat.id).filter(
            (Chat.user_id_1.in_(user_ids)) | (Chat.user_id_2.in_(user_ids)),
        ).all()
    ]

    return post_ids, reel_ids, story_ids, comment_ids, group_ids, chat_ids


def cleanup_activity_for_users(db, user_ids: list[int], delete_accounts: bool) -> None:
    if not user_ids:
        return

    post_ids, reel_ids, story_ids, comment_ids, group_ids, chat_ids = (
        get_owned_content_ids(db, user_ids)
    )

    db.query(Notification).filter(
        (Notification.to_user_id.in_(user_ids))
        | (Notification.from_user_id.in_(user_ids))
        | (Notification.post_id.in_(post_ids) if post_ids else False)
        | (Notification.reels_id.in_(reel_ids) if reel_ids else False)
        | (Notification.comment_id.in_(comment_ids) if comment_ids else False),
    ).delete(synchronize_session=False)

    if comment_ids:
        db.query(Like).filter(Like.comment_id.in_(comment_ids)).delete(synchronize_session=False)
    if post_ids:
        db.query(SavedPost).filter(SavedPost.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(Like).filter(Like.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(PostView).filter(PostView.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(PostMedia).filter(PostMedia.post_id.in_(post_ids)).delete(synchronize_session=False)
    if reel_ids:
        db.query(SavedReel).filter(SavedReel.reels_id.in_(reel_ids)).delete(synchronize_session=False)
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
    db.query(SavedReel).filter(SavedReel.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Like).filter(Like.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(StoryView).filter(StoryView.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(ReelView).filter(ReelView.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(PostView).filter(PostView.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Follow).filter(
        (Follow.follower_id.in_(user_ids)) | (Follow.following_id.in_(user_ids)),
    ).delete(synchronize_session=False)
    db.query(Note).filter(Note.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Story).filter(Story.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Reel).filter(Reel.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Post).filter(Post.user_id.in_(user_ids)).delete(synchronize_session=False)

    if delete_accounts:
        db.query(Profile).filter(Profile.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)


def cleanup_seed_accounts(db) -> None:
    profiles = db.query(Profile).join(User, User.id == Profile.user_id).filter(
        (Profile.username.in_(SEED_USERNAMES))
        | Profile.username.like("demo_%")
        | Profile.username.like("codex%")
        | User.phone_number.like(f"{SEED_PHONE_PREFIX}%")
        | User.phone_number.in_(LEGACY_SEED_PHONE_NUMBERS),
    ).all()
    user_ids = [profile.user_id for profile in profiles]

    cleanup_activity_for_users(db, user_ids, delete_accounts=True)


def unique_seed_username(db, preferred: str, user_id: int) -> str:
    profile = db.query(Profile).filter(Profile.username == preferred).first()
    if profile is None or profile.user_id == user_id:
        return preferred

    base = preferred.replace(".", "_")
    for suffix in range(2, 100):
        candidate = f"seed_{base}_{suffix}"
        if db.query(Profile).filter(Profile.username == candidate).first() is None:
            return candidate

    return f"seed_{base}_{user_id}"


def create_seed_user(db, person: dict) -> User:
    user = User(
        phone_number=person["phone_number"],
        hashed_password=hash_password(PASSWORD),
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        username=unique_seed_username(db, person["username"], user.id),
        full_name=person["full_name"],
        bio=person["bio"],
        avatar_url=person["avatar"],
        is_private=person.get("is_private", False),
    )
    user.profile = profile
    db.add(profile)
    db.flush()

    return user


def ensure_follow(db, follower: User, following: User, accepted: bool = True) -> None:
    if follower.id == following.id:
        return

    follow = db.query(Follow).filter(
        Follow.follower_id == follower.id,
        Follow.following_id == following.id,
    ).first()

    if follow is None:
        db.add(
            Follow(
                follower_id=follower.id,
                following_id=following.id,
                is_accepted=accepted,
            ),
        )
    else:
        follow.is_accepted = accepted


def ensure_post(
    db,
    user: User,
    description: str,
    hashtag: str,
    media_items: list[str],
    created_minutes_ago: int,
) -> Post:
    post = Post(
        user_id=user.id,
        description=description,
        hashtag=hashtag,
        views_count=0,
        created_at=get_dushanbe_time() - timedelta(minutes=created_minutes_ago),
    )
    db.add(post)
    db.flush()

    for index, item in enumerate(media_items):
        db.add(PostMedia(post_id=post.id, media_url=item, order_index=index))

    return post


def ensure_reel(
    db,
    user: User,
    description: str,
    hashtag: str,
    video_url: str,
    created_minutes_ago: int,
) -> Reel:
    reel = Reel(
        user_id=user.id,
        video_url=video_url,
        description=description,
        hashtag=hashtag,
        views_count=0,
        created_at=get_dushanbe_time() - timedelta(minutes=created_minutes_ago),
    )
    db.add(reel)
    db.flush()

    return reel


def ensure_story(db, user: User, media_url: str) -> Story:
    story = Story(
        user_id=user.id,
        media_url=media_url,
        expires_at=get_dushanbe_time() + timedelta(hours=24),
        views_count=0,
    )
    db.add(story)
    db.flush()

    return story


def ensure_note(db, user: User, text: str) -> None:
    db.add(
        Note(
            user_id=user.id,
            text=text,
            expires_at=get_dushanbe_time() + timedelta(hours=24),
        ),
    )


def ensure_comment(
    db,
    user: User,
    text: str,
    post: Post | None = None,
    reel: Reel | None = None,
) -> Comment:
    comment = Comment(
        user_id=user.id,
        text=text,
        post_id=post.id if post else None,
        reels_id=reel.id if reel else None,
    )
    db.add(comment)
    db.flush()

    return comment


def ensure_like(
    db,
    user: User,
    post: Post | None = None,
    reel: Reel | None = None,
    comment: Comment | None = None,
) -> None:
    db.add(
        Like(
            user_id=user.id,
            post_id=post.id if post else None,
            reels_id=reel.id if reel else None,
            comment_id=comment.id if comment else None,
        ),
    )


def ensure_post_view(db, user: User, post: Post) -> None:
    if user.id == post.user_id:
        return

    db.add(PostView(user_id=user.id, post_id=post.id))
    post.views_count += 1


def ensure_reel_view(db, user: User, reel: Reel, watched_percent: int = 80) -> None:
    if user.id == reel.user_id:
        return

    db.add(ReelView(user_id=user.id, reels_id=reel.id, watched_percent=watched_percent))
    if watched_percent >= 50:
        reel.views_count += 1


def ensure_story_view(db, user: User, story: Story) -> None:
    if user.id == story.user_id:
        return

    db.add(StoryView(user_id=user.id, story_id=story.id))
    story.views_count += 1


def ensure_saved_post(db, user: User, post: Post) -> None:
    if user.id == post.user_id:
        return

    db.add(SavedPost(user_id=user.id, post_id=post.id))


def ensure_saved_reel(db, user: User, reel: Reel) -> None:
    if user.id == reel.user_id:
        return

    db.add(SavedReel(user_id=user.id, reels_id=reel.id))


def ensure_chat(db, user_a: User, user_b: User) -> Chat:
    first_id, second_id = sorted([user_a.id, user_b.id])
    chat = Chat(user_id_1=first_id, user_id_2=second_id)
    db.add(chat)
    db.flush()

    return chat


def ensure_message(db, chat: Chat, sender: User, text: str) -> None:
    db.add(DirectMessage(chat_id=chat.id, sender_id=sender.id, text=text))
    chat.updated_at = get_dushanbe_time()


def ensure_group(db, owner: User, members: list[User], name: str, avatar_url: str, messages: list[str]) -> None:
    group = Group(owner_id=owner.id, name=name, avatar_url=avatar_url)
    db.add(group)
    db.flush()

    for member in members:
        db.add(GroupMember(group_id=group.id, user_id=member.id))

    for index, message in enumerate(messages):
        sender = members[index % len(members)]
        db.add(GroupMessage(group_id=group.id, sender_id=sender.id, text=message))


def seed_social_graph(db, users: list[User]) -> None:
    total = len(users)

    for index, user in enumerate(users):
        for distance in (1, 2, 4, 7):
            ensure_follow(db, user, users[(index + distance) % total], accepted=True)

        if index % 2 == 0:
            ensure_follow(db, users[(index + 5) % total], user, accepted=True)

        if index % 3 == 0:
            ensure_follow(db, user, users[(index + 9) % total], accepted=False)


def seed_posts(db, users: list[User]) -> list[Post]:
    posts = []

    for user_index, user in enumerate(users):
        first_name = user.profile.full_name.split()[0] if user.profile and user.profile.full_name else "Demo"

        for slot in range(5):
            post_index = user_index * 5 + slot
            description, hashtag = POSTS[post_index % len(POSTS)]
            description = f"{description} {first_name}'s set {slot + 1}."
            media_items = [IMAGE_URLS[(post_index * 2) % len(IMAGE_URLS)]]

            if post_index % 4 == 0:
                media_items.append(IMAGE_URLS[(post_index * 2 + 1) % len(IMAGE_URLS)])
            if post_index % 9 == 0:
                media_items.append(f"{VIDEO_URLS[post_index % len(VIDEO_URLS)]}?post={post_index}")

            posts.append(
                ensure_post(
                    db,
                    user,
                    description,
                    hashtag,
                    media_items,
                    created_minutes_ago=slot * len(users) + user_index,
                ),
            )

    return posts


def seed_reels(db, users: list[User]) -> list[Reel]:
    reels = []

    for user_index, user in enumerate(users):
        first_name = user.profile.full_name.split()[0] if user.profile and user.profile.full_name else "Demo"

        for slot in range(3):
            reel_index = user_index * 3 + slot
            extra_description, extra_hashtag = REELS[reel_index % len(REELS)]
            reels.append(
                ensure_reel(
                    db,
                    user,
                    f"{extra_description} {first_name}'s clip {slot + 1}.",
                    extra_hashtag,
                    f"{VIDEO_URLS[reel_index % len(VIDEO_URLS)]}?reel={reel_index}",
                    created_minutes_ago=slot * len(users) + user_index,
                ),
            )

    return reels


def seed_stories(db, users: list[User]) -> list[Story]:
    stories = []

    for index, user in enumerate(users):
        stories.append(ensure_story(db, user, IMAGE_URLS[(index + 80) % len(IMAGE_URLS)]))

        if index % 3 == 0:
            stories.append(
                ensure_story(
                    db,
                    user,
                    f"{VIDEO_URLS[(index + 7) % len(VIDEO_URLS)]}?story={index}",
                ),
            )

    return stories


def seed_engagement(db, users: list[User], posts: list[Post], reels: list[Reel], stories: list[Story]) -> None:
    total = len(users)

    for index, post in enumerate(posts):
        for offset in (1, 3):
            commenter = users[(index + offset) % total]
            if commenter.id == post.user_id:
                continue

            comment = ensure_comment(
                db,
                commenter,
                COMMENT_TEXTS[(index + offset) % len(COMMENT_TEXTS)],
                post=post,
            )
            ensure_like(db, users[(index + offset + 5) % total], comment=comment)

        for user_index, user in enumerate(users):
            if user.id == post.user_id:
                continue

            if (user_index + index) % 3 != 0:
                ensure_like(db, user, post=post)
            if (user_index + index) % 2 == 0:
                ensure_post_view(db, user, post)

        ensure_saved_post(db, users[(index + 6) % total], post)
        ensure_saved_post(db, users[(index + 11) % total], post)

    for index, reel in enumerate(reels):
        for offset in (2, 5):
            commenter = users[(index + offset) % total]
            if commenter.id == reel.user_id:
                continue

            comment = ensure_comment(
                db,
                commenter,
                COMMENT_TEXTS[(index + offset + 2) % len(COMMENT_TEXTS)],
                reel=reel,
            )
            ensure_like(db, users[(index + offset + 4) % total], comment=comment)

        for user_index, user in enumerate(users):
            if user.id == reel.user_id:
                continue

            if (user_index * 2 + index) % 4 != 0:
                ensure_like(db, user, reel=reel)
            if (user_index + index) % 2 == 1:
                ensure_reel_view(db, user, reel)

        ensure_saved_reel(db, users[(index + 4) % total], reel)

    for index, story in enumerate(stories):
        for offset in range(1, 9):
            ensure_story_view(db, users[(index + offset) % total], story)


def seed_messages(db, users: list[User]) -> None:
    for first, second, messages in DIRECT_THREADS:
        chat = ensure_chat(db, users[first], users[second])
        for index, message in enumerate(messages):
            sender = users[first] if index % 2 == 0 else users[second]
            ensure_message(db, chat, sender, message)

    for group_data in GROUPS:
        members = [users[index] for index in group_data["members"]]
        owner = users[group_data["owner"]]
        if owner not in members:
            members.insert(0, owner)

        ensure_group(
            db,
            owner,
            members,
            group_data["name"],
            group_data["avatar"],
            group_data["messages"],
        )


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        cleanup_seed_accounts(db)

        users = [create_seed_user(db, person) for person in PEOPLE]
        db.flush()

        for user, person in zip(users, PEOPLE, strict=True):
            ensure_note(db, user, person["note"])

        seed_social_graph(db, users)
        posts = seed_posts(db, users)
        reels = seed_reels(db, users)
        stories = seed_stories(db, users)
        seed_engagement(db, users, posts, reels, stories)
        seed_messages(db, users)

        db.commit()
        print(
            "Realistic seed complete. "
            f"Created {len(users)} synthetic users. "
            f"Password for seeded users: {PASSWORD}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
