import axios from 'axios'
import { Check, Heart, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  acceptFollowRequest,
  rejectFollowRequest,
} from '../api/notifications'
import { getPost } from '../api/feed'
import { followProfile } from '../api/profiles'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useNotificationsStore } from '../store/notificationsStore'
import type { NotificationItem } from '../types/notifications'
import { getApiError } from '../utils/apiError'
import { mediaUrl } from '../utils/media'
import { Avatar } from './Avatar'
import { TimeAgo } from './TimeAgo'

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

function notificationMessage(notification: NotificationItem) {
  switch (notification.type) {
    case 'like':
      return 'понравился ваш пост'
    case 'comment':
      return 'прокомментировал вашу публикацию'
    case 'follow':
      return 'подписался на вас'
    case 'follow_request':
      return 'хочет подписаться на вас'
    default:
      return 'отправил уведомление'
  }
}

function NotificationPreview({ src }: { src?: string | null }) {
  const resolvedSrc = mediaUrl(src)

  if (!resolvedSrc) {
    return null
  }

  return (
    <img
      className="h-11 w-11 shrink-0 rounded-sm object-cover"
      src={resolvedSrc}
      alt=""
      loading="lazy"
    />
  )
}

function NotificationActions({
  notification,
  isBusy,
  onAccept,
  onReject,
  onFollowBack,
}: {
  notification: NotificationItem
  isBusy: boolean
  onAccept: () => void
  onReject: () => void
  onFollowBack: () => void
}) {
  if (notification.type === 'follow_request') {
    return (
      <div className="mt-2 flex gap-2">
        <button
          className="h-8 rounded-lg bg-ig-primary px-3 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-50"
          type="button"
          disabled={isBusy}
          onClick={onAccept}
        >
          Подтвердить
        </button>
        <button
          className="h-8 rounded-lg bg-ig-elevated px-3 text-sm font-semibold text-ig-text transition hover:bg-[#2A2A2A] disabled:opacity-50"
          type="button"
          disabled={isBusy}
          onClick={onReject}
        >
          Удалить
        </button>
      </div>
    )
  }

  if (notification.type === 'follow') {
    if (notification.from_user.is_following) {
      return (
        <p className="mt-2 text-xs font-semibold text-ig-muted">Вы подписаны</p>
      )
    }

    if (notification.from_user.is_follow_requested) {
      return (
        <p className="mt-2 text-xs font-semibold text-ig-muted">Запрошено</p>
      )
    }

    return (
      <button
        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-ig-primary px-3 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-50"
        type="button"
        disabled={isBusy}
        onClick={onFollowBack}
      >
        <UserPlus size={16} />
        Подписаться
      </button>
    )
  }

  return null
}

function isResolvedFollowError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false
  }

  if (![400, 404].includes(error.response?.status ?? 0)) {
    return false
  }

  const detail = String(error.response?.data?.detail ?? '').toLowerCase()

  return (
    detail.includes('already following') ||
    detail.includes('already accepted') ||
    detail.includes('already sent') ||
    detail.includes('not found')
  )
}

function NotificationRow({
  notification,
  preview,
  isBusy,
  onAccept,
  onReject,
  onFollowBack,
  onOpenProfile,
}: {
  notification: NotificationItem
  preview?: string | null
  isBusy: boolean
  onAccept: () => void
  onReject: () => void
  onFollowBack: () => void
  onOpenProfile: () => void
}) {
  return (
    <article
      className={`flex gap-3 px-5 py-3 transition hover:bg-ig-elevated ${
        notification.is_read ? 'bg-transparent' : 'bg-white/[0.045]'
      }`}
    >
      <button
        className="shrink-0"
        type="button"
        aria-label={`Открыть профиль ${notification.from_user.username}`}
        onClick={onOpenProfile}
      >
        <Avatar
          size={44}
          src={notification.from_user.avatar_url}
        username={notification.from_user.username}
        />
      </button>
      <div className="min-w-0 flex-1">
        <button className="w-full text-left" type="button" onClick={onOpenProfile}>
          <p className="text-sm leading-5 text-ig-text">
            <span className="font-semibold">
              {notification.from_user.username}
            </span>{' '}
            {notificationMessage(notification)}{' '}
            <TimeAgo
              className="whitespace-nowrap text-ig-muted"
              value={notification.created_at}
            />
          </p>
        </button>
        <NotificationActions
          isBusy={isBusy}
          notification={notification}
          onAccept={onAccept}
          onFollowBack={onFollowBack}
          onReject={onReject}
        />
      </div>
      <NotificationPreview src={preview} />
      {!notification.is_read && (
        <span className="mt-5 h-2 w-2 shrink-0 rounded-full bg-ig-primary" />
      )}
    </article>
  )
}

function NotificationsEmpty() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
        <Heart size={42} strokeWidth={1.8} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Уведомлений пока нет</h2>
      <p className="mt-2 text-sm text-ig-muted">
        Здесь появятся лайки, комментарии и новые подписчики.
      </p>
    </div>
  )
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const navigate = useNavigate()
  const notifications = useNotificationsStore((state) => state.notifications)
  const hasNext = useNotificationsStore((state) => state.hasNext)
  const isLoading = useNotificationsStore((state) => state.isLoading)
  const isLoadingMore = useNotificationsStore((state) => state.isLoadingMore)
  const error = useNotificationsStore((state) => state.error)
  const loadNotifications = useNotificationsStore(
    (state) => state.loadNotifications,
  )
  const loadMore = useNotificationsStore((state) => state.loadMore)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const markRead = useNotificationsStore((state) => state.markRead)
  const removeNotification = useNotificationsStore(
    (state) => state.removeNotification,
  )
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [postPreviews, setPostPreviews] = useState<Record<number, string | null>>({})

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isOpen, loadNotifications])

  const missingPostIds = useMemo(
    () =>
      Array.from(
        new Set(
          notifications
            .map((notification) => notification.post_id)
            .filter((postId): postId is number => Boolean(postId)),
        ),
      ).filter((postId) => !(postId in postPreviews)),
    [notifications, postPreviews],
  )

  useEffect(() => {
    if (!isOpen || missingPostIds.length === 0) {
      return undefined
    }

    let cancelled = false

    async function loadPreviews() {
      const entries = await Promise.all(
        missingPostIds.map(async (postId) => {
          try {
            const data = await getPost(postId)
            const media = [...data.post.media].sort(
              (a, b) => a.order_index - b.order_index,
            )[0]

            return [postId, media?.media_url ?? null] as const
          } catch {
            return [postId, null] as const
          }
        }),
      )

      if (!cancelled) {
        setPostPreviews((current) => ({ ...current, ...Object.fromEntries(entries) }))
      }
    }

    void loadPreviews()

    return () => {
      cancelled = true
    }
  }, [isOpen, missingPostIds])

  const handleLoadMore = useCallback(() => {
    void loadMore()
  }, [loadMore])

  const sentinelRef = useInfiniteScroll({
    disabled: !isOpen || !hasNext || isLoading || isLoadingMore,
    onLoadMore: handleLoadMore,
  })

  async function handleAccept(notification: NotificationItem) {
    setBusyId(notification.id)
    setActionError(null)

    try {
      await acceptFollowRequest(notification.from_user.username)
      removeNotification(notification.id)
    } catch (error) {
      if (isResolvedFollowError(error)) {
        removeNotification(notification.id)
      } else {
        setActionError(getApiError(error))
      }
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(notification: NotificationItem) {
    setBusyId(notification.id)
    setActionError(null)

    try {
      await rejectFollowRequest(notification.from_user.username)
      removeNotification(notification.id)
    } catch (error) {
      if (isResolvedFollowError(error)) {
        removeNotification(notification.id)
      } else {
        setActionError(getApiError(error))
      }
    } finally {
      setBusyId(null)
    }
  }

  async function handleFollowBack(notification: NotificationItem) {
    setBusyId(notification.id)
    setActionError(null)

    try {
      await followProfile(notification.from_user.username)
      removeNotification(notification.id)
    } catch (error) {
      if (isResolvedFollowError(error)) {
        removeNotification(notification.id)
      } else {
        setActionError(getApiError(error))
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section
      className={`fixed inset-y-0 left-[72px] z-40 w-[420px] max-w-[calc(100vw-72px)] border-r border-ig-border bg-ig-bg shadow-[16px_0_40px_rgba(0,0,0,0.5)] transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
        isOpen
          ? 'translate-x-0 opacity-100'
          : 'pointer-events-none -translate-x-5 opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <header className="flex h-20 items-center justify-between px-5">
        <h1 className="text-2xl font-bold">Уведомления</h1>
        <button
          className="rounded-full p-2 text-ig-muted transition hover:bg-ig-elevated hover:text-ig-text"
          type="button"
          aria-label="Закрыть уведомления"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </header>

      <div className="flex h-[calc(100svh-80px)] flex-col">
        <div className="flex items-center justify-between border-b border-ig-border px-5 pb-3">
          <span className="text-base font-semibold">Новые</span>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-ig-primary transition hover:bg-ig-elevated disabled:opacity-40"
            type="button"
            disabled={notifications.length === 0}
            onClick={() => void markAllRead()}
          >
            <Check size={16} />
            Прочитать все
          </button>
        </div>

        {(error || actionError) && (
          <div className="mx-5 mt-4 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-sm">
            {actionError ?? error}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {isLoading && (
            <div className="space-y-2 px-5 py-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div className="flex items-center gap-3 py-2" key={index}>
                  <div className="h-11 w-11 animate-pulse rounded-full bg-ig-elevated" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded-full bg-ig-elevated" />
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-ig-elevated" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && <NotificationsEmpty />}

          {!isLoading &&
            notifications.map((notification) => (
              <NotificationRow
                isBusy={busyId === notification.id}
                key={notification.id}
                notification={notification}
                preview={
                  notification.post_id
                    ? postPreviews[notification.post_id]
                    : null
                }
                onAccept={() => void handleAccept(notification)}
                onFollowBack={() => void handleFollowBack(notification)}
                onOpenProfile={() => {
                  if (!notification.is_read) {
                    void markRead(notification.id)
                  }
                  onClose()
                  navigate(`/profile/${notification.from_user.username}`)
                }}
                onReject={() => void handleReject(notification)}
              />
            ))}

          {isLoadingMore && (
            <div className="px-5 py-4 text-center text-sm text-ig-muted">
              Загружаем...
            </div>
          )}
          <div ref={sentinelRef} />
        </div>
      </div>
    </section>
  )
}
