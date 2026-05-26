import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Post } from '../types/feed'
import { compactNumber } from '../utils/format'
import { isVideoUrl, mediaUrl } from '../utils/media'
import { Avatar } from './Avatar'
import { PostActionsSheet } from './PostActionsSheet'
import { PostCaption } from './PostCaption'
import { TimeAgo } from './TimeAgo'

interface PostCardProps {
  post: Post
  onLike: (postId: number) => void
  onOpen: (post: Post) => void
  onSave: (postId: number) => void
  onViewed: (postId: number) => void
  onDelete?: (postId: number) => Promise<void> | void
  onOpenViewers?: (post: Post) => void
}

export function PostCard({
  post,
  onLike,
  onOpen,
  onSave,
  onViewed,
  onDelete,
  onOpenViewers,
}: PostCardProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [showPulse, setShowPulse] = useState(false)
  const media = useMemo(
    () => [...post.media].sort((a, b) => a.order_index - b.order_index),
    [post.media],
  )
  const activeMedia = media[activeIndex]
  const activeMediaUrl = mediaUrl(activeMedia?.media_url)
  const canDelete =
    post.user_id === currentUser?.id ||
    post.user.username === currentUser?.profile.username

  useEffect(() => {
    onViewed(post.id)
  }, [onViewed, post.id])

  function handlePrevious() {
    setActiveIndex((current) => Math.max(0, current - 1))
  }

  function handleNext() {
    setActiveIndex((current) => Math.min(media.length - 1, current + 1))
  }

  function handleDoubleClick() {
    setShowPulse(true)

    if (!post.is_liked) {
      onLike(post.id)
    }

    window.setTimeout(() => setShowPulse(false), 650)
  }

  function openProfile(username: string) {
    navigate(`/profile/${username}`)
  }

  return (
    <article className="mx-auto w-full max-w-[560px] border-b border-ig-border pb-5">
      <header className="flex h-14 items-center gap-3">
        <button type="button" onClick={() => openProfile(post.user.username)}>
          <Avatar size={32} src={post.user.avatar_url} username={post.user.username} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <button
              className="truncate font-semibold"
              type="button"
              onClick={() => openProfile(post.user.username)}
            >
              {post.user.username}
            </button>
            <span className="text-ig-faint">•</span>
            <TimeAgo className="text-ig-muted" value={post.created_at} />
          </div>
        </div>
        <button
          className="rounded-full p-2 text-ig-text transition hover:bg-ig-elevated"
          type="button"
          onClick={() => setIsActionsOpen(true)}
          aria-label="Ещё"
        >
          <MoreHorizontal size={20} />
        </button>
      </header>
      <div
        className="relative aspect-square overflow-hidden rounded-sm border border-ig-border bg-ig-surface"
        onDoubleClick={handleDoubleClick}
      >
        {activeMediaUrl ? (
          isVideoUrl(activeMedia?.media_url) ? (
            <video
              className="h-full w-full object-cover"
              src={activeMediaUrl}
              controls
              muted
              playsInline
            />
          ) : (
            <img
              className="h-full w-full object-cover"
              src={activeMediaUrl}
              alt={post.description ?? `Публикация ${post.user.username}`}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ig-muted">
            Медиа недоступно
          </div>
        )}
        {showPulse && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart
              className="animate-[ping_0.65s_ease-out_1] fill-white text-white drop-shadow-2xl"
              size={92}
            />
          </div>
        )}
        {media.length > 1 && activeIndex > 0 && (
          <button
            className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
            type="button"
            aria-label="Предыдущее медиа"
            onClick={handlePrevious}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {media.length > 1 && activeIndex < media.length - 1 && (
          <button
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
            type="button"
            aria-label="Следующее медиа"
            onClick={handleNext}
          >
            <ChevronRight size={20} />
          </button>
        )}
        {media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            {media.map((item, index) => (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  index === activeIndex ? 'bg-ig-primary' : 'bg-white/50'
                }`}
                key={item.id}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className={`inline-flex items-center gap-1.5 transition hover:text-ig-muted ${
              post.is_liked ? 'text-ig-danger' : 'text-ig-text'
            }`}
            type="button"
            aria-label="Нравится"
            onClick={() => onLike(post.id)}
          >
            <Heart size={25} fill={post.is_liked ? 'currentColor' : 'none'} />
            <span className="min-w-[1ch] text-sm font-semibold">
              {compactNumber(post.likes_count)}
            </span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 text-ig-text transition hover:text-ig-muted"
            type="button"
            aria-label="Комментарии"
            onClick={() => onOpen(post)}
          >
            <MessageCircle size={25} />
            <span className="min-w-[1ch] text-sm font-semibold">
              {compactNumber(post.comments_count)}
            </span>
          </button>
          <span className="text-ig-muted" aria-label="Поделиться">
            <Send size={25} />
          </span>
        </div>
        <button
          className="transition hover:text-ig-muted"
          type="button"
          aria-label="Сохранить"
          onClick={() => onSave(post.id)}
        >
          <Bookmark size={25} fill={post.is_saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="mt-2 space-y-1 text-sm leading-5">
        <PostCaption post={post} onUsernameClick={openProfile} />
        {post.comments_count > 0 && (
          <button
            className="text-left text-ig-muted transition hover:text-ig-text"
            type="button"
            onClick={() => onOpen(post)}
          >
            Посмотреть все {compactNumber(post.comments_count)} комментариев
          </button>
        )}
        <TimeAgo
          className="block pt-1 text-[10px] uppercase text-ig-faint"
          value={post.created_at}
        />
      </div>
      <PostActionsSheet
        canDelete={canDelete}
        isOpen={isActionsOpen}
        post={post}
        onClose={() => setIsActionsOpen(false)}
        onDelete={onDelete ? () => onDelete(post.id) : undefined}
        onOpenPost={() => onOpen(post)}
        onOpenViewers={canDelete ? () => onOpenViewers?.(post) : undefined}
        onToggleSaved={() => onSave(post.id)}
      />
    </article>
  )
}
