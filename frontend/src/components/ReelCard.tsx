import { Heart, MessageCircle, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Reel } from '../types/reels'
import { compactNumber } from '../utils/format'
import { mediaUrl } from '../utils/media'
import { Avatar } from './Avatar'

interface ReelCardProps {
  reel: Reel
  isFollowed: boolean
  onComment: (reel: Reel) => void
  onFollow: (username: string) => void
  onLike: (reelsId: number) => void
  onViewed: (reelsId: number, watchedPercent: number) => void
}

export function ReelCard({
  reel,
  isFollowed,
  onComment,
  onFollow,
  onLike,
  onViewed,
}: ReelCardProps) {
  const navigate = useNavigate()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cardRef = useRef<HTMLElement | null>(null)
  const hasSentViewRef = useRef(false)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const resolvedVideoUrl = mediaUrl(reel.video_url)
  const isMine = currentUserId === reel.user_id

  useEffect(() => {
    const card = cardRef.current

    if (!card) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextActive = entry.intersectionRatio >= 0.65
        setIsActive(nextActive)

        if (nextActive && !hasSentViewRef.current) {
          hasSentViewRef.current = true
          onViewed(reel.id, 50)
        }
      },
      { threshold: [0.2, 0.65, 0.9] },
    )

    observer.observe(card)

    return () => observer.disconnect()
  }, [onViewed, reel.id])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (isActive && !isPaused) {
      video.muted = isMuted

      void video.play().catch(() => {
        video.muted = true
        setIsMuted(true)
        void video.play().catch(() => undefined)
      })
      return
    }

    video.pause()
  }, [isActive, isMuted, isPaused])

  function togglePlayback() {
    setIsPaused((current) => !current)
  }

  function toggleSound() {
    setIsMuted((current) => !current)
  }

  function openProfile() {
    navigate(`/profile/${reel.user.username}`)
  }

  return (
    <section
      className="flex min-h-svh snap-start items-center justify-center px-4 py-6"
      ref={cardRef}
    >
      <div className="flex h-[min(760px,calc(100svh-48px))] w-full max-w-[520px] items-end justify-center gap-4">
        <div className="relative h-full flex-1 overflow-hidden rounded-lg border border-ig-border bg-ig-surface shadow-2xl">
          {resolvedVideoUrl ? (
            <video
              className="h-full w-full object-cover"
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              ref={videoRef}
              src={resolvedVideoUrl}
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

          {resolvedVideoUrl && (
            <button
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
              type="button"
              aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
              onClick={toggleSound}
            >
              {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 pb-5 pt-24">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                className="text-sm font-semibold transition hover:text-white/75"
                type="button"
                onClick={openProfile}
              >
                {reel.user.username}
              </button>
              {!isMine && !isFollowed && (
                <button
                  className="rounded-lg border border-white/60 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white hover:text-black"
                  type="button"
                  onClick={() => onFollow(reel.user.username)}
                >
                  Подписаться
                </button>
              )}
              {!isMine && isFollowed && (
                <span className="rounded-lg border border-white/30 px-3 py-1 text-xs font-semibold text-white/80">
                  Запрошено
                </span>
              )}
            </div>
            {(reel.description || reel.hashtag) && (
              <p className="mt-3 line-clamp-3 text-sm leading-5 text-white">
                {reel.description}
                {reel.hashtag && (
                  <span className="ml-1 font-semibold text-white">
                    {reel.hashtag}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-16 shrink-0 flex-col items-center gap-5 pb-2">
          <button type="button" onClick={openProfile}>
            <Avatar size={44} src={reel.user.avatar_url} username={reel.user.username} />
          </button>
          <button
            className="flex flex-col items-center gap-1 text-ig-text transition hover:text-ig-muted"
            type="button"
            aria-label="Нравится"
            onClick={() => onLike(reel.id)}
          >
            <Heart
              size={30}
              className={reel.is_liked ? 'text-ig-danger' : ''}
              fill={reel.is_liked ? 'currentColor' : 'none'}
            />
            <span className="text-xs font-semibold">
              {compactNumber(reel.likes_count)}
            </span>
          </button>
          <button
            className="flex flex-col items-center gap-1 text-ig-text transition hover:text-ig-muted"
            type="button"
            aria-label="Комментарии"
            onClick={() => onComment(reel)}
          >
            <MessageCircle size={30} />
            <span className="text-xs font-semibold">
              {compactNumber(reel.comments_count)}
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
