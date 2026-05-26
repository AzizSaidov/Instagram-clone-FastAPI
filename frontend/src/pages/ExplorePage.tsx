import { Heart, Images, MessageCircle, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deletePost,
  getExplorePosts,
  getPost,
  togglePostLike,
  togglePostSaved,
  viewPost,
} from '../api/feed'
import { PostDetailModal } from '../components/PostDetailModal'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import type { Post } from '../types/feed'
import { getApiError } from '../utils/apiError'
import { compactNumber } from '../utils/format'
import { isVideoUrl, mediaUrl } from '../utils/media'

const EXPLORE_LIMIT = 24

function updatePost(
  posts: Post[],
  postId: number,
  updater: (post: Post) => Post,
) {
  return posts.map((post) => (post.id === postId ? updater(post) : post))
}

function previewKey(post: Post) {
  return [...post.media].sort((a, b) => a.order_index - b.order_index)[0]
    ?.media_url ?? `post:${post.id}`
}

function mergeUniquePosts(current: Post[], incoming: Post[]) {
  const seenIds = new Set(current.map((post) => post.id))
  const seenPreviews = new Set(current.map(previewKey))
  const next = [...current]

  for (const post of incoming) {
    const key = previewKey(post)

    if (seenIds.has(post.id) || seenPreviews.has(key)) {
      continue
    }

    seenIds.add(post.id)
    seenPreviews.add(key)
    next.push(post)
  }

  return next
}

function ExploreTile({
  post,
  onClick,
}: {
  post: Post
  onClick: () => void
}) {
  const media = useMemo(
    () => [...post.media].sort((a, b) => a.order_index - b.order_index),
    [post.media],
  )
  const preview = media[0]
  const previewUrl = mediaUrl(preview?.media_url)

  return (
    <button
      className="group relative aspect-square overflow-hidden bg-ig-surface text-left"
      type="button"
      onClick={onClick}
    >
      {previewUrl ? (
        isVideoUrl(preview?.media_url) ? (
          <video
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            src={previewUrl}
            alt={post.description ?? `Публикация ${post.user.username}`}
            loading="lazy"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-ig-muted">
          Медиа
        </div>
      )}

      {media.length > 1 && (
        <Images
          className="absolute right-3 top-3 text-white drop-shadow-lg"
          size={22}
          aria-hidden="true"
        />
      )}

      <span className="absolute inset-0 flex items-center justify-center gap-7 bg-black/0 text-sm font-bold text-white opacity-0 transition duration-150 group-hover:bg-black/45 group-hover:opacity-100">
        <span className="inline-flex items-center gap-2">
          <Heart size={21} fill="currentColor" />
          {compactNumber(post.likes_count)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MessageCircle size={21} fill="currentColor" />
          {compactNumber(post.comments_count)}
        </span>
      </span>
    </button>
  )
}

function ExploreSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {Array.from({ length: 15 }).map((_, index) => (
        <div
          className="aspect-square animate-pulse bg-ig-elevated"
          key={index}
        />
      ))}
    </div>
  )
}

function EmptyExplore() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
        <Search size={42} strokeWidth={1.8} />
      </div>
      <h1 className="mt-5 text-xl font-semibold">Публикаций пока нет</h1>
      <p className="mt-2 max-w-sm text-sm text-ig-muted">
        Здесь появятся рекомендованные публикации от новых авторов.
      </p>
    </div>
  )
}

export function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasNext, setHasNext] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getExplorePosts(EXPLORE_LIMIT, 0)
        setPosts(mergeUniquePosts([], data.posts))
        setOffset(data.posts.length)
        setHasNext(data.has_next)
      } catch (error) {
        setError(getApiError(error))
      } finally {
        setIsLoading(false)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (!hasNext || isLoading || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)
    setError(null)

    try {
      const data = await getExplorePosts(EXPLORE_LIMIT, offset)
      setPosts((current) => mergeUniquePosts(current, data.posts))
      setOffset((current) => current + data.posts.length)
      setHasNext(data.has_next)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasNext, isLoading, isLoadingMore, offset])

  const sentinelRef = useInfiniteScroll({
    disabled: !hasNext || isLoading || isLoadingMore,
    onLoadMore: () => void handleLoadMore(),
  })

  async function handleOpenPost(post: Post) {
    setSelectedPost(post)
    setIsModalLoading(true)

    try {
      void viewPost(post.id)
      const data = await getPost(post.id)
      setSelectedPost(data.post)
      setPosts((current) =>
        updatePost(current, post.id, () => data.post),
      )
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsModalLoading(false)
    }
  }

  async function handleLike(postId: number) {
    const current = posts.find((post) => post.id === postId) ?? selectedPost

    if (!current) {
      return
    }

    setPosts((items) =>
      updatePost(items, postId, (post) => ({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.likes_count + (post.is_liked ? -1 : 1),
      })),
    )
    setSelectedPost((post) =>
      post?.id === postId
        ? {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.likes_count + (post.is_liked ? -1 : 1),
          }
        : post,
    )

    try {
      const data = await togglePostLike(postId)
      const nextLikes =
        current.likes_count +
        (data.is_liked === current.is_liked ? 0 : data.is_liked ? 1 : -1)

      setPosts((items) =>
        updatePost(items, postId, (post) => ({
          ...post,
          is_liked: data.is_liked,
          likes_count: nextLikes,
        })),
      )
      setSelectedPost((post) =>
        post?.id === postId
          ? { ...post, is_liked: data.is_liked, likes_count: nextLikes }
          : post,
      )
    } catch (error) {
      setError(getApiError(error))
      setPosts((items) => updatePost(items, postId, () => current))
      setSelectedPost((post) => (post?.id === postId ? current : post))
    }
  }

  async function handleSave(postId: number) {
    const current = posts.find((post) => post.id === postId) ?? selectedPost

    if (!current) {
      return
    }

    setPosts((items) =>
      updatePost(items, postId, (post) => ({
        ...post,
        is_saved: !post.is_saved,
      })),
    )
    setSelectedPost((post) =>
      post?.id === postId ? { ...post, is_saved: !post.is_saved } : post,
    )

    try {
      const data = await togglePostSaved(postId)
      setPosts((items) =>
        updatePost(items, postId, (post) => ({
          ...post,
          is_saved: data.is_saved,
        })),
      )
      setSelectedPost((post) =>
        post?.id === postId ? { ...post, is_saved: data.is_saved } : post,
      )
    } catch (error) {
      setError(getApiError(error))
      setPosts((items) => updatePost(items, postId, () => current))
      setSelectedPost((post) => (post?.id === postId ? current : post))
    }
  }

  async function handleDeletePost(postId: number) {
    setError(null)

    try {
      await deletePost(postId)
      setPosts((items) => items.filter((post) => post.id !== postId))
      setSelectedPost((post) => (post?.id === postId ? null : post))
    } catch (error) {
      setError(getApiError(error))
      throw error
    }
  }

  return (
    <main className="min-h-svh bg-ig-bg px-1 pb-20 pt-1 text-ig-text sm:px-8 sm:pt-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="sr-only">Интересное</h1>

        {error && (
          <div className="mb-4 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading && <ExploreSkeleton />}

        {!isLoading && posts.length === 0 && <EmptyExplore />}

        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {posts.map((post) => (
              <ExploreTile
                key={post.id}
                post={post}
                onClick={() => void handleOpenPost(post)}
              />
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="mt-1 grid grid-cols-3 gap-1 md:gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="aspect-square animate-pulse bg-ig-elevated"
                key={index}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} />
      </section>

      {selectedPost && (
        <PostDetailModal
          isLoading={isModalLoading}
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={(postId) => void handleLike(postId)}
          onPostChange={(post) => {
            setSelectedPost(post)
            setPosts((items) =>
              items.map((item) => (item.id === post.id ? post : item)),
            )
          }}
          onSave={(postId) => void handleSave(postId)}
          onDelete={handleDeletePost}
        />
      )}
    </main>
  )
}
