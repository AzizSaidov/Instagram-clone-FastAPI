import {
  Bookmark,
  Camera,
  ChevronDown,
  Film,
  Grid3X3,
  Heart,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Settings,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createChat } from '../api/messages'
import {
  blockProfile,
  followProfile,
  getMyPosts,
  getProfile,
  getSavedPosts,
  unfollowProfile,
} from '../api/profiles'
import {
  deletePost,
  getPost,
  togglePostLike,
  togglePostSaved,
  viewPost,
} from '../api/feed'
import { Avatar } from '../components/Avatar'
import { FollowListModal, type FollowListKind } from '../components/FollowListModal'
import { PostDetailModal } from '../components/PostDetailModal'
import { ReelViewerModal } from '../components/ReelViewerModal'
import { useAuthStore } from '../store/authStore'
import type { Post } from '../types/feed'
import type { Reel } from '../types/reels'
import type { ProfilePage as ProfilePageType } from '../types/profiles'
import { getApiError } from '../utils/apiError'
import { compactNumber } from '../utils/format'
import { isVideoUrl, mediaUrl } from '../utils/media'

type ProfileTab = 'posts' | 'saved' | 'reels'

function postPreview(post: Post) {
  return [...post.media].sort((a, b) => a.order_index - b.order_index)[0]
}

function MediaTile({
  post,
  onClick,
}: {
  post: Post
  onClick: () => void
}) {
  const preview = postPreview(post)
  const previewUrl = mediaUrl(preview?.media_url)

  return (
    <button
      className="group relative aspect-square overflow-hidden bg-ig-surface"
      type="button"
      onClick={onClick}
    >
      {previewUrl ? (
        isVideoUrl(preview?.media_url) ? (
          <video
            className="h-full w-full object-cover"
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            className="h-full w-full object-cover"
            src={previewUrl}
            alt={post.description ?? `Публикация ${post.user.username}`}
            loading="lazy"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ig-muted">
          <ImageIcon size={26} />
        </div>
      )}
      <span className="absolute inset-0 flex items-center justify-center gap-6 bg-black/0 text-sm font-bold text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
        <span className="inline-flex items-center gap-2">
          <Heart size={20} fill="currentColor" />
          {compactNumber(post.likes_count)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MessageCircle size={20} fill="currentColor" />
          {compactNumber(post.comments_count)}
        </span>
      </span>
    </button>
  )
}

function ReelTile({ reel, onClick }: { reel: Reel; onClick: () => void }) {
  const videoUrl = mediaUrl(reel.video_url)

  return (
    <button
      className="group relative aspect-square overflow-hidden bg-ig-surface"
      type="button"
      onClick={onClick}
    >
      {videoUrl ? (
        <video
          className="h-full w-full object-cover"
          src={videoUrl}
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ig-muted">
          <Film size={26} />
        </div>
      )}
      <Film
        className="absolute right-3 top-3 text-white drop-shadow-lg"
        size={22}
      />
      <span className="absolute inset-0 flex items-center justify-center gap-6 bg-black/0 text-sm font-bold text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
        <span className="inline-flex items-center gap-2">
          <Heart size={20} fill="currentColor" />
          {compactNumber(reel.likes_count)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MessageCircle size={20} fill="currentColor" />
          {compactNumber(reel.comments_count)}
        </span>
      </span>
    </button>
  )
}

function EmptyGrid({
  icon,
  title,
  text,
}: {
  icon: 'posts' | 'saved' | 'reels'
  title: string
  text: string
}) {
  const Icon =
    icon === 'saved'
      ? Bookmark
      : icon === 'reels'
          ? Film
          : Camera

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
        <Icon size={42} strokeWidth={1.7} />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-ig-muted">{text}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto min-h-svh max-w-5xl px-4 py-8 sm:px-8">
      <div className="flex gap-10">
        <div className="h-[150px] w-[150px] animate-pulse rounded-full bg-ig-elevated" />
        <div className="flex-1 space-y-4 pt-3">
          <div className="h-8 w-52 animate-pulse rounded-full bg-ig-elevated" />
          <div className="h-5 w-72 animate-pulse rounded-full bg-ig-elevated" />
          <div className="h-20 w-full max-w-md animate-pulse rounded-lg bg-ig-elevated" />
        </div>
      </div>
    </main>
  )
}

export function ProfilePage() {
  const { username = '' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loadMe = useAuthStore((state) => state.loadMe)
  const [profile, setProfile] = useState<ProfilePageType | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [reels, setReels] = useState<Reel[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [followListKind, setFollowListKind] = useState<FollowListKind | null>(null)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedUsername = username.toLowerCase()
  const myUsername = user?.profile.username
  const isOwnProfile = Boolean(
    myUsername && normalizedUsername === myUsername.toLowerCase(),
  )
  const isPrivateLocked = Boolean(
    profile?.is_private && !profile.is_following && !isOwnProfile,
  )

  useEffect(() => {
    if (!user) {
      const timer = window.setTimeout(() => {
        void loadMe().catch(() => undefined)
      }, 0)

      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [loadMe, user])

  const loadProfile = useCallback(async () => {
    if (!username) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getProfile(username, 30, 0)
      setProfile(data.profile)
      setPosts(data.posts)
      setReels(data.reels)
      setActiveTab('posts')

      if (
        myUsername &&
        data.profile.username === myUsername
      ) {
        const [myPostsData, savedData] = await Promise.all([
          getMyPosts(30, 0).catch(() => null),
          getSavedPosts(30, 0).catch(() => null),
        ])

        if (myPostsData) {
          setPosts(myPostsData.posts)
        }

        if (savedData) {
          setSavedPosts(savedData.saved_posts.map((item) => item.post))
        }
      } else {
        setSavedPosts([])
      }
    } catch (error) {
      setError(getApiError(error))
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [myUsername, username])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadProfile])

  async function refreshSelectedPost(postId: number) {
    try {
      const data = await getPost(postId)
      setSelectedPost(data.post)
      setPosts((items) =>
        items.map((post) => (post.id === postId ? data.post : post)),
      )
      setSavedPosts((items) =>
        items.map((post) => (post.id === postId ? data.post : post)),
      )
    } catch {
      // The modal still has the optimistic post if refresh fails.
    }
  }

  async function handleOpenPost(post: Post) {
    setSelectedPost(post)
    void viewPost(post.id)
    await refreshSelectedPost(post.id)
  }

  async function handleToggleLike(postId: number) {
    await togglePostLike(postId)
    await refreshSelectedPost(postId)
  }

  async function handleToggleSaved(postId: number) {
    await togglePostSaved(postId)
    await refreshSelectedPost(postId)
  }

  async function handleDeletePost(postId: number) {
    setIsSaving(true)
    setError(null)

    try {
      await deletePost(postId)
      setPosts((items) => items.filter((post) => post.id !== postId))
      setSavedPosts((items) => items.filter((post) => post.id !== postId))
      setSelectedPost((post) => (post?.id === postId ? null : post))
      setProfile((current) =>
        current
          ? {
              ...current,
              posts_count: Math.max(0, current.posts_count - 1),
            }
          : current,
      )
    } catch (error) {
      setError(getApiError(error))
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  function handleReelChange(updatedReel: Reel) {
    setReels((items) =>
      items.map((reel) => (reel.id === updatedReel.id ? updatedReel : reel)),
    )
  }

  async function handleFollow() {
    if (!profile) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (profile.is_following || profile.is_follow_requested) {
        await unfollowProfile(profile.username)
        setProfile({
          ...profile,
          is_following: false,
          is_follow_requested: false,
          followers_count: Math.max(
            0,
            profile.followers_count - (profile.is_following ? 1 : 0),
          ),
        })
      } else {
        const response = await followProfile(profile.username)
        setProfile({
          ...profile,
          is_following: response.follow.is_accepted,
          is_follow_requested: !response.follow.is_accepted,
          followers_count:
            profile.followers_count + (response.follow.is_accepted ? 1 : 0),
        })
      }
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMessage() {
    if (!profile) {
      return
    }

    setIsSaving(true)

    try {
      const data = await createChat(profile.username)
      navigate(`/messages/${data.chat.id}`)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleBlock() {
    if (!profile) {
      return
    }

    setIsSaving(true)

    try {
      await blockProfile(profile.username)
      navigate('/')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const visiblePosts = activeTab === 'saved' ? savedPosts : posts

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Профиль недоступен</h1>
          <p className="mt-2 text-sm text-ig-muted">
            {error ?? 'Не удалось открыть этот профиль.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-5xl px-4 pb-24 pt-8 text-ig-text sm:px-8">
      {error && (
        <div className="mb-5 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <header className="grid gap-8 border-b border-ig-border pb-10 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex justify-center sm:justify-start sm:pl-8">
          <Avatar size={150} src={profile.avatar_url} username={profile.username} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-normal">{profile.username}</h1>
            {isOwnProfile ? (
              <button
                className="rounded-full p-2 transition hover:bg-ig-elevated"
                type="button"
                aria-label="Настройки"
                onClick={() => navigate('/settings')}
              >
                <Settings size={22} />
              </button>
            ) : (
              <>
                <button
                  className={`h-8 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-50 ${
                    profile.is_following || profile.is_follow_requested
                      ? 'bg-ig-elevated text-ig-text hover:bg-[#2A2A2A]'
                      : 'bg-ig-primary text-white hover:bg-[#1877F2]'
                  }`}
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleFollow()}
                >
                  {profile.is_following
                    ? 'Following'
                    : profile.is_follow_requested
                      ? 'Запрошено'
                      : 'Подписаться'}
                </button>
                <button
                  className="h-8 rounded-lg bg-ig-elevated px-4 text-sm font-semibold transition hover:bg-[#2A2A2A] disabled:opacity-50"
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleMessage()}
                >
                  Написать
                </button>
                <div className="relative">
                  <button
                    className="flex h-8 w-9 items-center justify-center rounded-lg bg-ig-elevated transition hover:bg-[#2A2A2A]"
                    type="button"
                    aria-label="Ещё"
                    onClick={() => setIsMoreOpen((value) => !value)}
                  >
                    <ChevronDown size={18} />
                  </button>
                  {isMoreOpen && (
                    <div className="absolute right-0 top-10 z-10 w-44 overflow-hidden rounded-lg border border-ig-border bg-ig-surface shadow-2xl">
                      <button
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-ig-danger transition hover:bg-ig-elevated"
                        type="button"
                        onClick={() => void handleBlock()}
                      >
                        Заблокировать
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="rounded-full p-2 transition hover:bg-ig-elevated"
                  type="button"
                  aria-label="Ещё"
                  onClick={() => setIsMoreOpen((value) => !value)}
                >
                  <MoreHorizontal size={22} />
                </button>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-8 text-base">
            <span>
              <b>{compactNumber(profile.posts_count)}</b> публикаций
            </span>
            <button
              className="transition hover:text-ig-muted"
              type="button"
              onClick={() => setFollowListKind('followers')}
            >
              <b>{compactNumber(profile.followers_count)}</b> подписчиков
            </button>
            <button
              className="transition hover:text-ig-muted"
              type="button"
              onClick={() => setFollowListKind('following')}
            >
              <b>{compactNumber(profile.following_count)}</b> подписки
            </button>
          </div>

          <div className="mt-5 max-w-xl text-sm leading-5">
            {profile.full_name && (
              <p className="font-semibold">{profile.full_name}</p>
            )}
            {profile.bio && <p className="whitespace-pre-line">{profile.bio}</p>}
          </div>

        </div>
      </header>

      <nav className="flex justify-center gap-10 text-xs font-semibold uppercase tracking-[0.08em] text-ig-muted">
        <button
          className={`flex h-12 items-center gap-2 border-t ${
            activeTab === 'posts'
              ? 'border-ig-text text-ig-text'
              : 'border-transparent'
          }`}
          type="button"
          onClick={() => setActiveTab('posts')}
        >
          <Grid3X3 size={14} />
          Публикации
        </button>
        {isOwnProfile && (
            <button
              className={`flex h-12 items-center gap-2 border-t ${
                activeTab === 'saved'
                  ? 'border-ig-text text-ig-text'
                  : 'border-transparent'
              }`}
              type="button"
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={14} />
              Сохранённые
            </button>
        )}
          <button
            className={`flex h-12 items-center gap-2 border-t ${
              activeTab === 'reels'
                ? 'border-ig-text text-ig-text'
                : 'border-transparent'
            }`}
            type="button"
            onClick={() => setActiveTab('reels')}
          >
            <Film size={14} />
            Reels
          </button>
      </nav>

      {isPrivateLocked ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
            <Lock size={42} strokeWidth={1.7} />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Этот аккаунт закрыт</h2>
          <p className="mt-2 text-sm text-ig-muted">
            Подпишитесь, чтобы видеть фото и видео.
          </p>
        </div>
      ) : activeTab === 'reels' ? (
        reels.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {reels.map((reel, index) => (
              <ReelTile
                key={reel.id}
                reel={reel}
                onClick={() => setSelectedReelIndex(index)}
              />
            ))}
          </div>
        ) : (
          <EmptyGrid icon="reels" title="Reels пока нет" text="Видео появятся здесь." />
        )
      ) : visiblePosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {visiblePosts.map((post) => (
            <MediaTile
              key={post.id}
              post={post}
              onClick={() => void handleOpenPost(post)}
            />
          ))}
        </div>
      ) : (
        <EmptyGrid
          icon={activeTab === 'saved' ? 'saved' : 'posts'}
          title={activeTab === 'saved' ? 'Сохранённых нет' : 'Публикаций пока нет'}
          text={
            activeTab === 'saved'
              ? 'Сохранённые публикации будете видеть только вы.'
              : 'Когда появятся публикации, они будут здесь.'
          }
        />
      )}

      {followListKind && (
        <FollowListModal
          kind={followListKind}
          username={profile.username}
          onClose={() => setFollowListKind(null)}
          onOwnFollowersDelta={(delta) =>
            setProfile((current) =>
              current
                ? {
                    ...current,
                    followers_count: Math.max(
                      0,
                      current.followers_count + delta,
                    ),
                  }
                : current,
            )
          }
          onOwnFollowingDelta={(delta) =>
            setProfile((current) =>
              current
                ? {
                    ...current,
                    following_count: Math.max(
                      0,
                      current.following_count + delta,
                    ),
                  }
                : current,
            )
          }
        />
      )}

      {selectedReelIndex !== null && (
        <ReelViewerModal
          initialIndex={selectedReelIndex}
          reels={reels}
          onClose={() => setSelectedReelIndex(null)}
          onReelChange={handleReelChange}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={(postId) => void handleToggleLike(postId)}
          onPostChange={(post) => {
            setSelectedPost(post)
            setPosts((items) =>
              items.map((item) => (item.id === post.id ? post : item)),
            )
            setSavedPosts((items) =>
              items.map((item) => (item.id === post.id ? post : item)),
            )
          }}
          onSave={(postId) => void handleToggleSaved(postId)}
          onDelete={handleDeletePost}
        />
      )}
    </main>
  )
}
