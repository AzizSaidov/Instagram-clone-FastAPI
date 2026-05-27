import { Send, Trash2, X } from 'lucide-react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createChat, sendChatMessage } from '../api/messages'
import { getPost, getStoryViewers } from '../api/feed'
import { useAuthStore } from '../store/authStore'
import type { StoryGroup } from '../store/storiesStore'
import type { Story } from '../types/feed'
import { getApiError } from '../utils/apiError'
import { isVideoUrl, mediaUrl } from '../utils/media'
import { Avatar } from './Avatar'
import { TimeAgo } from './TimeAgo'
import { ViewersModal } from './ViewersModal'

interface StoryViewerProps {
  groups: StoryGroup[]
  initialGroupIndex: number
  onClose: () => void
  onDelete: (storyId: number) => Promise<void>
  onViewed: (storyId: number) => Promise<void> | void
}

const IMAGE_DURATION_MS = 5000

function getFirstPostMediaUrl(story: Story) {
  if (!story.post_id) {
    return Promise.resolve<string | null>(null)
  }

  return getPost(story.post_id).then((data) => {
    const media = [...data.post.media].sort(
      (a, b) => a.order_index - b.order_index,
    )[0]

    return media?.media_url ?? null
  })
}

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onDelete,
  onViewed,
}: StoryViewerProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [mediaSource, setMediaSource] = useState<string | null>(null)
  const [isResolvingMedia, setIsResolvingMedia] = useState(false)
  const [durationMs, setDurationMs] = useState(IMAGE_DURATION_MS)
  const [progress, setProgress] = useState(0)
  const [replyText, setReplyText] = useState('')
  const [viewersStoryId, setViewersStoryId] = useState<number | null>(null)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const group = groups[groupIndex]
  const story = group?.stories[storyIndex]
  const resolvedMediaUrl = mediaUrl(mediaSource)
  const isVideo = Boolean(mediaSource && isVideoUrl(mediaSource))
  const isMine = Boolean(story && story.user_id === currentUserId)

  const progressItems = useMemo(() => group?.stories ?? [], [group?.stories])

  const goNext = useCallback(() => {
    const currentGroup = groups[groupIndex]

    if (!currentGroup) {
      onClose()
      return
    }

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((current) => current + 1)
      return
    }

    if (groupIndex < groups.length - 1) {
      setGroupIndex((current) => current + 1)
      setStoryIndex(0)
      return
    }

    onClose()
  }, [groupIndex, groups, onClose, storyIndex])

  const goPrevious = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((current) => current - 1)
      return
    }

    if (groupIndex > 0) {
      const previousGroup = groups[groupIndex - 1]
      setGroupIndex((current) => current - 1)
      setStoryIndex(Math.max(0, previousGroup.stories.length - 1))
    }
  }, [groupIndex, groups, storyIndex])

  useEffect(() => {
    if (!story) {
      onClose()
      return
    }

    void onViewed(story.id)
  }, [onClose, onViewed, story])

  useEffect(() => {
    let isCurrent = true

    async function resolveMedia() {
      if (!story) {
        return
      }

      setIsResolvingMedia(true)
      setError(null)
      setDurationMs(IMAGE_DURATION_MS)

      try {
        const source = story.media_url ?? (await getFirstPostMediaUrl(story))

        if (isCurrent) {
          setMediaSource(source)
        }
      } catch (error) {
        if (isCurrent) {
          setError(getApiError(error))
          setMediaSource(null)
        }
      } finally {
        if (isCurrent) {
          setIsResolvingMedia(false)
        }
      }
    }

    void resolveMedia()

    return () => {
      isCurrent = false
    }
  }, [story])

  useEffect(() => {
    if (!story || isResolvingMedia || viewersStoryId !== null) {
      return undefined
    }

    let frame = 0
    const startTimer = window.setTimeout(() => {
      setProgress(0)
      frame = window.requestAnimationFrame(() => setProgress(100))
    }, 0)
    const timer = window.setTimeout(goNext, durationMs)

    return () => {
      window.clearTimeout(startTimer)
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [durationMs, goNext, isResolvingMedia, story, viewersStoryId])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (viewersStoryId !== null) {
        return
      }

      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowRight') {
        goNext()
      }

      if (event.key === 'ArrowLeft') {
        goPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrevious, onClose, viewersStoryId])

  async function handleDeleteStory() {
    if (!story) {
      return
    }

    try {
      await onDelete(story.id)
      goNext()
    } catch (error) {
      setError(getApiError(error))
    }
  }

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const text = replyText.trim()

    if (!text || !story || isMine || isSendingReply) {
      return
    }

    setIsSendingReply(true)
    setError(null)

    try {
      const chat = await createChat(story.user.username)
      await sendChatMessage(chat.chat.id, {
        text: `Ответ на историю: ${text}`,
      })
      setReplyText('')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSendingReply(false)
    }
  }

  if (!group || !story) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#121316]/95 px-4 py-5 text-white">
      <button
        className="absolute right-5 top-5 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <X size={30} />
      </button>

      <section className="relative flex h-[min(760px,calc(100svh-40px))] w-full max-w-[430px] overflow-hidden rounded-xl bg-black shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 via-black/25 to-transparent px-4 pb-10 pt-3">
          <div className="flex gap-1">
            {progressItems.map((item, index) => (
              <div
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
                key={item.id}
              >
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    transition:
                      index === storyIndex
                        ? `width ${durationMs}ms linear`
                        : 'none',
                    width:
                      index < storyIndex
                        ? '100%'
                        : index === storyIndex
                          ? `${progress}%`
                          : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Avatar size={32} src={story.user.avatar_url} username={story.user.username} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{story.user.username}</p>
              <TimeAgo
                className="block text-xs text-white/70"
                value={story.created_at}
              />
            </div>
            {isMine && (
              <div className="pointer-events-auto flex items-center gap-1">
                <button
                  className="rounded-full px-2 py-1 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
                  type="button"
                  onClick={() => setViewersStoryId(story.id)}
                >
                  {story.views_count} просмотров
                </button>
                <button
                  className="rounded-full p-2 text-white/85 transition hover:bg-white/10 hover:text-white"
                  type="button"
                  aria-label="Удалить историю"
                  onClick={() => void handleDeleteStory()}
                >
                  <Trash2 size={19} />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          className="absolute bottom-20 left-0 top-20 z-10 w-1/2"
          type="button"
          aria-label="Предыдущая история"
          onClick={goPrevious}
        />
        <button
          className="absolute bottom-20 right-0 top-20 z-10 w-1/2"
          type="button"
          aria-label="Следующая история"
          onClick={goNext}
        />

        <div className="flex h-full w-full items-center justify-center">
          {isResolvingMedia ? (
            <div className="text-sm text-white/70">Загружаем...</div>
          ) : resolvedMediaUrl ? (
            isVideo ? (
              <video
                className="h-full w-full object-contain"
                autoPlay
                playsInline
                src={resolvedMediaUrl}
                onLoadedMetadata={(event) => {
                  const seconds = event.currentTarget.duration
                  setDurationMs(
                    Number.isFinite(seconds)
                      ? Math.max(3000, seconds * 1000)
                      : IMAGE_DURATION_MS,
                  )
                }}
              />
            ) : (
              <img
                className="h-full w-full object-contain"
                src={resolvedMediaUrl}
                alt={`История ${story.user.username}`}
              />
            )
          ) : (
            <div className="px-6 text-center text-sm text-white/70">
              Медиа истории недоступно
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-14">
          {error && (
            <p className="mb-3 rounded-lg border border-ig-danger/50 bg-ig-danger/20 px-3 py-2 text-xs">
              {error}
            </p>
          )}
          <form className="flex items-center gap-2" onSubmit={handleReplySubmit}>
            <input
              className="h-11 min-w-0 flex-1 rounded-full border border-white/45 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/70 focus:border-white disabled:opacity-50"
              placeholder={isMine ? 'Это ваша история' : 'Ответить...'}
              value={replyText}
              disabled={isMine || isSendingReply}
              onChange={(event) => setReplyText(event.target.value)}
            />
            {!isMine && (
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10 disabled:opacity-40"
                type="submit"
                disabled={!replyText.trim() || isSendingReply}
                aria-label="Отправить"
              >
                <Send size={22} />
              </button>
            )}
          </form>
        </div>
      </section>
      {viewersStoryId !== null && (
        <ViewersModal
          title="Просмотры истории"
          viewerKey={viewersStoryId}
          loadViewers={() => getStoryViewers(viewersStoryId)}
          onClose={() => setViewersStoryId(null)}
        />
      )}
    </div>
  )
}
