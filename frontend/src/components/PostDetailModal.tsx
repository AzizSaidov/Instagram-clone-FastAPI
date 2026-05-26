import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createPostComment,
  deleteComment,
  getPostComments,
} from '../api/comments'
import { getPostViewers } from '../api/feed'
import { useAuthStore } from '../store/authStore'
import type { Comment } from '../types/comments'
import type { Post } from '../types/feed'
import { getApiError } from '../utils/apiError'
import { compactNumber } from '../utils/format'
import { isVideoUrl, mediaUrl } from '../utils/media'
import { Avatar } from './Avatar'
import { PostActionsSheet } from './PostActionsSheet'
import { PostCaption } from './PostCaption'
import { TimeAgo } from './TimeAgo'
import { ViewersModal } from './ViewersModal'

interface PostDetailModalProps {
  post: Post
  isLoading?: boolean
  onClose: () => void
  onLike: (postId: number) => void
  onSave: (postId: number) => void
  onPostChange?: (post: Post) => void
  onDelete?: (postId: number) => Promise<void> | void
}

export function PostDetailModal({
  post,
  isLoading = false,
  onClose,
  onLike,
  onSave,
  onPostChange,
  onDelete,
}: PostDetailModalProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const myUsername = currentUser?.profile.username
  const [activeIndex, setActiveIndex] = useState(0)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isViewersOpen, setIsViewersOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsOffset, setCommentsOffset] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [isMoreLoading, setIsMoreLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement | null>(null)
  const media = useMemo(
    () => [...post.media].sort((a, b) => a.order_index - b.order_index),
    [post.media],
  )
  const activeMedia = media[activeIndex]
  const activeMediaUrl = mediaUrl(activeMedia?.media_url)
  const canDelete =
    post.user_id === currentUser?.id || post.user.username === myUsername

  const loadComments = useCallback(async () => {
    setIsCommentsLoading(true)
    setError(null)

    try {
      const data = await getPostComments(post.id, 30, 0)
      setComments([...data.comments].reverse())
      setCommentsOffset(data.comments.length)
      setHasMoreComments(data.has_next)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsCommentsLoading(false)
    }
  }, [post.id])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadComments()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadComments])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ block: 'end' })
  }, [comments.length])

  function handlePrevious() {
    setActiveIndex((current) => Math.max(0, current - 1))
  }

  function handleNext() {
    setActiveIndex((current) => Math.min(media.length - 1, current + 1))
  }

  function openProfile(username: string) {
    onClose()
    navigate(`/profile/${username}`)
  }

  async function handleLoadMoreComments() {
    if (!hasMoreComments || isMoreLoading) {
      return
    }

    setIsMoreLoading(true)
    setError(null)

    try {
      const data = await getPostComments(post.id, 30, commentsOffset)
      setComments((current) => [...data.comments].reverse().concat(current))
      setCommentsOffset((current) => current + data.comments.length)
      setHasMoreComments(data.has_next)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsMoreLoading(false)
    }
  }

  async function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const text = commentText.trim()

    if (!text || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const data = await createPostComment(post.id, text)
      setComments((current) =>
        current.some((comment) => comment.id === data.comment.id)
          ? current
          : [...current, data.comment],
      )
      setCommentText('')
      onPostChange?.({
        ...post,
        comments_count: post.comments_count + 1,
      })
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteComment(comment: Comment) {
    setError(null)

    try {
      await deleteComment(comment.id)
      setComments((current) => current.filter((item) => item.id !== comment.id))
      onPostChange?.({
        ...post,
        comments_count: Math.max(0, post.comments_count - 1),
      })
    } catch (error) {
      setError(getApiError(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
      <button
        className="absolute right-4 top-4 rounded-full p-2 text-white transition hover:bg-white/10"
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <X size={26} />
      </button>

      <article className="grid max-h-[92svh] w-full max-w-[930px] overflow-hidden rounded-sm border border-ig-border bg-ig-bg shadow-2xl md:grid-cols-[minmax(0,560px)_370px]">
        <div className="relative flex min-h-[320px] items-center justify-center bg-black md:min-h-[560px]">
          {activeMediaUrl ? (
            isVideoUrl(activeMedia?.media_url) ? (
              <video
                className="h-full max-h-[92svh] w-full object-contain"
                controls
                muted
                playsInline
                src={activeMediaUrl}
              />
            ) : (
              <img
                className="h-full max-h-[92svh] w-full object-contain"
                src={activeMediaUrl}
                alt={post.description ?? `Публикация ${post.user.username}`}
              />
            )
          ) : (
            <div className="text-sm text-ig-muted">Медиа недоступно</div>
          )}

          {media.length > 1 && activeIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
              type="button"
              aria-label="Предыдущее медиа"
              onClick={handlePrevious}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {media.length > 1 && activeIndex < media.length - 1 && (
            <button
              className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
              type="button"
              aria-label="Следующее медиа"
              onClick={handleNext}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-col border-t border-ig-border md:border-l md:border-t-0">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ig-border px-4">
            <button type="button" onClick={() => openProfile(post.user.username)}>
              <Avatar size={32} src={post.user.avatar_url} username={post.user.username} />
            </button>
            <button
              className="min-w-0 flex-1 text-left"
              type="button"
              onClick={() => openProfile(post.user.username)}
            >
              <p className="truncate text-sm font-semibold">{post.user.username}</p>
            </button>
            <button
              className="rounded-full p-2 transition hover:bg-ig-elevated"
              type="button"
              onClick={() => setIsActionsOpen(true)}
              aria-label="Ещё"
            >
              <MoreHorizontal size={20} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {(post.description || post.hashtag) && (
              <PostCaption post={post} showUsername={false} />
            )}

            <div className="mt-5 space-y-4">
              {hasMoreComments && (
                <button
                  className="text-sm font-semibold text-ig-muted transition hover:text-ig-text"
                  type="button"
                  disabled={isMoreLoading}
                  onClick={() => void handleLoadMoreComments()}
                >
                  {isMoreLoading ? 'Загружаем...' : 'Показать предыдущие комментарии'}
                </button>
              )}

              {isCommentsLoading && (
                <p className="text-sm text-ig-muted">Загружаем комментарии...</p>
              )}

              {!isCommentsLoading && comments.length === 0 && (
                <p className="text-sm text-ig-muted">Комментариев пока нет</p>
              )}

              {comments.map((comment) => (
                <article className="flex gap-3" key={comment.id}>
                  <button
                    className="h-8 shrink-0"
                    type="button"
                    onClick={() => openProfile(comment.user.username)}
                  >
                    <Avatar
                      size={32}
                      src={comment.user.avatar_url}
                      username={comment.user.username}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5">
                      <button
                        className="font-semibold"
                        type="button"
                        onClick={() => openProfile(comment.user.username)}
                      >
                        {comment.user.username}
                      </button>{' '}
                      {comment.text}
                    </p>
                    <TimeAgo
                      className="mt-1 block text-xs text-ig-muted"
                      value={comment.created_at}
                    />
                  </div>
                  {comment.user.username === myUsername && (
                    <button
                      className="self-start rounded-full p-1 text-ig-muted transition hover:bg-ig-elevated hover:text-ig-danger"
                      type="button"
                      aria-label="Удалить комментарий"
                      onClick={() => void handleDeleteComment(comment)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </article>
              ))}
              <div ref={commentsEndRef} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-ig-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className={`transition hover:text-ig-muted ${
                    post.is_liked ? 'text-ig-danger' : 'text-ig-text'
                  }`}
                  type="button"
                  aria-label="Нравится"
                  disabled={isLoading}
                  onClick={() => onLike(post.id)}
                >
                  <Heart
                    size={25}
                    fill={post.is_liked ? 'currentColor' : 'none'}
                  />
                </button>
                <MessageCircle size={25} />
                <Send size={25} className="text-ig-muted" />
              </div>
              <button
                className="transition hover:text-ig-muted"
                type="button"
                aria-label="Сохранить"
                disabled={isLoading}
                onClick={() => onSave(post.id)}
              >
                <Bookmark size={25} fill={post.is_saved ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold">
              {compactNumber(post.likes_count)} likes
            </p>
            <TimeAgo
              className="mt-1 block text-[10px] uppercase text-ig-faint"
              value={post.created_at}
            />
            {canDelete && (
              <button
                className="mt-2 text-xs font-semibold text-ig-muted transition hover:text-ig-text"
                type="button"
                onClick={() => setIsViewersOpen(true)}
              >
                {compactNumber(post.views_count)} просмотров
              </button>
            )}
            {error && (
              <p className="mt-2 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-xs">
                {error}
              </p>
            )}
            <form
              className="mt-3 flex items-center gap-3 border-t border-ig-border pt-3"
              onSubmit={handleSubmitComment}
            >
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ig-faint"
                maxLength={500}
                placeholder="Добавить комментарий..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <button
                className="text-sm font-semibold text-ig-primary disabled:cursor-not-allowed disabled:opacity-40"
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
              >
                Опубликовать
              </button>
            </form>
          </footer>
        </div>
      </article>

      <PostActionsSheet
        canDelete={canDelete}
        isOpen={isActionsOpen}
        post={post}
        onClose={() => setIsActionsOpen(false)}
        onDelete={onDelete ? () => onDelete(post.id) : undefined}
        onOpenViewers={canDelete ? () => setIsViewersOpen(true) : undefined}
        onToggleSaved={() => onSave(post.id)}
      />
      {isViewersOpen && (
        <ViewersModal
          title="Просмотры публикации"
          loadViewers={() => getPostViewers(post.id)}
          onClose={() => setIsViewersOpen(false)}
        />
      )}
    </div>
  )
}
