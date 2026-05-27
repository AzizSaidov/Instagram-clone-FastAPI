import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toggleCommentLike } from '../api/comments'
import { getCommentLikeUsers, getReelLikeUsers } from '../api/likes'
import {
  addReelComment,
  getReelComments,
  getReelViewers,
  toggleReelLike,
  toggleReelSaved,
  updateReelView,
} from '../api/reels'
import { useAuthStore } from '../store/authStore'
import type { Comment, Reel } from '../types/reels'
import { getApiError } from '../utils/apiError'
import { compactNumber } from '../utils/format'
import { mediaUrl } from '../utils/media'
import { Avatar } from './Avatar'
import { ReelsCommentsSheet } from './ReelsCommentsSheet'
import { ViewersModal } from './ViewersModal'

interface ReelViewerModalProps {
  reels: Reel[]
  initialIndex: number
  onClose: () => void
  onReelChange: (reel: Reel) => void
}

function nextLikeState(reel: Reel, isLiked: boolean) {
  return {
    ...reel,
    is_liked: isLiked,
    likes_count:
      reel.likes_count + (isLiked === reel.is_liked ? 0 : isLiked ? 1 : -1),
  }
}

function nextSaveState(reel: Reel, isSaved: boolean) {
  return {
    ...reel,
    is_saved: isSaved,
  }
}

export function ReelViewerModal({
  reels,
  initialIndex,
  onClose,
  onReelChange,
}: ReelViewerModalProps) {
  const navigate = useNavigate()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), reels.length - 1)
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeCommentsReelId, setActiveCommentsReelId] = useState<number | null>(
    null,
  )
  const [viewersReelId, setViewersReelId] = useState<number | null>(null)
  const [likesModal, setLikesModal] = useState<
    { kind: 'reel' | 'comment'; id: number; title: string } | null
  >(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [isCommentSending, setIsCommentSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const viewedReelIdsRef = useRef<Set<number>>(new Set())
  const currentReel = reels[activeIndex]
  const activeCommentsReel = useMemo(
    () =>
      activeCommentsReelId === null
        ? null
        : reels.find((reel) => reel.id === activeCommentsReelId) ?? null,
    [activeCommentsReelId, reels],
  )
  const videoUrl = mediaUrl(currentReel?.video_url)
  const hasPrevious = activeIndex > 0
  const hasNext = activeIndex < reels.length - 1
  const isMine = currentReel?.user_id === currentUserId

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1))
    setIsPaused(false)
  }, [])

  const showNext = useCallback(() => {
    setActiveIndex((index) => Math.min(reels.length - 1, index + 1))
    setIsPaused(false)
  }, [reels.length])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowLeft') {
        showPrevious()
      }

      if (event.key === 'ArrowRight') {
        showNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showNext, showPrevious])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    video.currentTime = 0
  }, [currentReel?.id])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (isPaused) {
      video.pause()
      return
    }

    video.muted = isMuted

    void video.play().catch(() => {
      video.muted = true
      setIsMuted(true)
      void video.play().catch(() => undefined)
    })
  }, [currentReel?.id, isMuted, isPaused])

  useEffect(() => {
    if (!currentReel || viewedReelIdsRef.current.has(currentReel.id)) {
      return
    }

    viewedReelIdsRef.current.add(currentReel.id)

    void updateReelView(currentReel.id, 50)
      .then(({ reel }) => onReelChange(reel))
      .catch(() => undefined)
  }, [currentReel, onReelChange])

  if (!currentReel) {
    return null
  }

  function togglePlayback() {
    setIsPaused((value) => !value)
  }

  function toggleSound() {
    setIsMuted((value) => !value)
  }

  function openProfile(username: string) {
    onClose()
    navigate(`/profile/${username}`)
  }

  async function handleLike() {
    const previousReel = currentReel
    const optimisticReel = nextLikeState(currentReel, !currentReel.is_liked)

    onReelChange(optimisticReel)
    setError(null)

    try {
      const data = await toggleReelLike(currentReel.id)
      onReelChange(nextLikeState(previousReel, data.is_liked))
    } catch (error) {
      onReelChange(previousReel)
      setError(getApiError(error))
    }
  }

  async function handleSave() {
    const previousReel = currentReel
    const optimisticReel = nextSaveState(currentReel, !currentReel.is_saved)

    onReelChange(optimisticReel)
    setError(null)

    try {
      const data = await toggleReelSaved(currentReel.id)
      onReelChange(nextSaveState(previousReel, data.is_saved))
    } catch (error) {
      onReelChange(previousReel)
      setError(getApiError(error))
    }
  }

  async function openComments() {
    setActiveCommentsReelId(currentReel.id)
    setIsCommentsLoading(true)
    setError(null)

    try {
      const data = await getReelComments(currentReel.id)
      setComments(data.comments)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsCommentsLoading(false)
    }
  }

  async function sendComment(text: string) {
    setIsCommentSending(true)
    setError(null)

    try {
      const data = await addReelComment(currentReel.id, text)
      setComments((items) => [data.comment, ...items])
      onReelChange({
        ...currentReel,
        comments_count: currentReel.comments_count + 1,
      })
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsCommentSending(false)
    }
  }

  async function handleCommentLike(comment: Comment) {
    const previousComment = comment
    const nextIsLiked = !comment.is_liked

    setComments((items) =>
      items.map((item) =>
        item.id === comment.id
          ? {
              ...item,
              is_liked: nextIsLiked,
              likes_count: Math.max(
                0,
                item.likes_count + (nextIsLiked ? 1 : -1),
              ),
            }
          : item,
      ),
    )
    setError(null)

    try {
      const data = await toggleCommentLike(comment.id)
      setComments((items) =>
        items.map((item) =>
          item.id === comment.id
            ? {
                ...item,
                is_liked: data.is_liked,
                likes_count: Math.max(
                  0,
                  previousComment.likes_count +
                    (data.is_liked === previousComment.is_liked
                      ? 0
                      : data.is_liked
                        ? 1
                        : -1),
                ),
              }
            : item,
        ),
      )
    } catch (error) {
      setComments((items) =>
        items.map((item) =>
          item.id === previousComment.id ? previousComment : item,
        ),
      )
      setError(getApiError(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-ig-text">
      <button
        className="absolute right-4 top-4 rounded-full p-2 text-white transition hover:bg-white/10"
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <X size={28} />
      </button>

      <div className="flex h-full items-center justify-center px-4 py-5">
        <div className="flex h-[min(850px,calc(100svh-40px))] w-full max-w-[660px] items-end justify-center gap-4">
          <div className="relative h-full flex-1 overflow-hidden rounded-lg border border-ig-border bg-ig-surface shadow-2xl">
            {videoUrl ? (
              <video
                className="h-full w-full object-cover"
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                ref={videoRef}
                src={videoUrl}
                onClick={togglePlayback}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ig-muted">
                Видео недоступно
              </div>
            )}

            {isPaused && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45">
                  <Play className="ml-1 fill-white text-white" size={34} />
                </div>
              </div>
            )}

            <button
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
              type="button"
              aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
              onClick={toggleSound}
            >
              {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>

            {hasPrevious && (
              <button
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
                type="button"
                aria-label="Предыдущий Reel"
                onClick={showPrevious}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {hasNext && (
              <button
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
                type="button"
                aria-label="Следующий Reel"
                onClick={showNext}
              >
                <ChevronRight size={24} />
              </button>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent px-5 pb-5 pt-28">
              <button
                className="pointer-events-auto flex items-center gap-3 text-left"
                type="button"
                onClick={() => openProfile(currentReel.user.username)}
              >
                <Avatar
                  size={32}
                  src={currentReel.user.avatar_url}
                  username={currentReel.user.username}
                />
                <span className="text-sm font-semibold">
                  {currentReel.user.username}
                </span>
              </button>
              {(currentReel.description || currentReel.hashtag) && (
                <p className="mt-3 line-clamp-4 text-sm leading-5 text-white">
                  {currentReel.description}
                  {currentReel.hashtag && (
                    <span className="ml-1 font-semibold text-ig-primary">
                      {currentReel.hashtag}
                    </span>
                  )}
                </p>
              )}
              {error && (
                <p className="pointer-events-auto mt-3 rounded-sm border border-ig-danger/50 bg-ig-danger/20 px-3 py-2 text-xs">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="flex w-16 shrink-0 flex-col items-center gap-5 pb-2">
            <div className="flex flex-col items-center gap-1 text-ig-text">
              <button
                className="transition hover:text-ig-muted"
                type="button"
                aria-label="Нравится"
                onClick={() => void handleLike()}
              >
                <Heart
                  size={31}
                  className={currentReel.is_liked ? 'text-ig-danger' : ''}
                  fill={currentReel.is_liked ? 'currentColor' : 'none'}
                />
              </button>
              <button
                className="text-xs font-semibold transition hover:text-ig-muted"
                type="button"
                onClick={() =>
                  setLikesModal({
                    kind: 'reel',
                    id: currentReel.id,
                    title: 'Лайки Reel',
                  })
                }
              >
                {compactNumber(currentReel.likes_count)}
              </button>
            </div>
            <button
              className="flex flex-col items-center gap-1 text-ig-text transition hover:text-ig-muted"
              type="button"
              aria-label="Комментарии"
              onClick={() => void openComments()}
            >
              <MessageCircle size={31} />
              <span className="text-xs font-semibold">
                {compactNumber(currentReel.comments_count)}
              </span>
            </button>
            <button
              className="flex flex-col items-center gap-1 text-ig-text transition hover:text-ig-muted"
              type="button"
              aria-label="Сохранить"
              onClick={() => void handleSave()}
            >
              <Bookmark
                size={31}
                fill={currentReel.is_saved ? 'currentColor' : 'none'}
              />
            </button>
            {isMine && (
              <button
                className="flex flex-col items-center gap-1 text-ig-text transition hover:text-ig-muted"
                type="button"
                aria-label="Просмотры"
                onClick={() => setViewersReelId(currentReel.id)}
              >
                <span className="text-xl font-semibold">
                  {compactNumber(currentReel.views_count)}
                </span>
                <span className="text-[10px] font-semibold">views</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeCommentsReel && (
        <ReelsCommentsSheet
          comments={comments}
          isLoading={isCommentsLoading}
          isSending={isCommentSending}
          reel={activeCommentsReel}
          onClose={() => setActiveCommentsReelId(null)}
          onLikeComment={handleCommentLike}
          onOpenCommentLikes={(comment) =>
            setLikesModal({
              kind: 'comment',
              id: comment.id,
              title: 'Лайки комментария',
            })
          }
          onSend={sendComment}
        />
      )}
      {viewersReelId !== null && (
        <ViewersModal
          title="Просмотры Reel"
          viewerKey={viewersReelId}
          loadViewers={() => getReelViewers(viewersReelId)}
          onClose={() => setViewersReelId(null)}
        />
      )}
      {likesModal && (
        <ViewersModal
          title={likesModal.title}
          viewerKey={`${likesModal.kind}-${likesModal.id}`}
          loadViewers={() =>
            likesModal.kind === 'reel'
              ? getReelLikeUsers(likesModal.id)
              : getCommentLikeUsers(likesModal.id)
          }
          onClose={() => setLikesModal(null)}
        />
      )}
    </div>
  )
}
