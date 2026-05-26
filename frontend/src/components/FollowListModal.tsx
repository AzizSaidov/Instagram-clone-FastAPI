import { Check, Clock3, Loader2, Search, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  followProfile,
  getFollowers,
  getFollowing,
  getProfile,
  removeFollower,
  unfollowProfile,
} from '../api/profiles'
import { useAuthStore } from '../store/authStore'
import type { ProfileSearchUser } from '../types/profiles'
import { getApiError } from '../utils/apiError'
import { Avatar } from './Avatar'

export type FollowListKind = 'followers' | 'following'

type FollowStatus = 'idle' | 'following' | 'requested' | 'self'

interface FollowListUser extends ProfileSearchUser {
  followStatus: FollowStatus
}

interface FollowListModalProps {
  username: string
  kind: FollowListKind
  onClose: () => void
  onOwnFollowersDelta?: (delta: number) => void
  onOwnFollowingDelta?: (delta: number) => void
}

const FOLLOW_LIMIT = 20

function titleFromKind(kind: FollowListKind) {
  return kind === 'followers' ? 'Подписчики' : 'Подписки'
}

function buttonMeta(status: FollowStatus) {
  switch (status) {
    case 'following':
      return {
        label: 'Подписки',
        icon: Check,
        className: 'bg-ig-elevated text-ig-text hover:bg-[#2A2A2A]',
      }
    case 'requested':
      return {
        label: 'Запрошено',
        icon: Clock3,
        className: 'bg-ig-elevated text-ig-text hover:bg-[#2A2A2A]',
      }
    case 'self':
      return {
        label: 'Это вы',
        icon: Check,
        className: 'bg-transparent text-ig-muted',
      }
    default:
      return {
        label: 'Подписаться',
        icon: UserPlus,
        className: 'bg-ig-primary text-white hover:bg-[#1877F2]',
      }
  }
}

function statusFromProfile(
  user: ProfileSearchUser,
  myUsername: string | undefined,
  isFollowing = false,
  isRequested = false,
): FollowStatus {
  if (user.username === myUsername) {
    return 'self'
  }

  if (isFollowing) {
    return 'following'
  }

  if (isRequested) {
    return 'requested'
  }

  return 'idle'
}

function FollowRow({
  user,
  isBusy,
  onOpen,
  onToggle,
  actionLabel,
  actionClassName,
}: {
  user: FollowListUser
  isBusy: boolean
  onOpen: () => void
  onToggle: () => void
  actionLabel?: string
  actionClassName?: string
}) {
  const meta = buttonMeta(user.followStatus)
  const Icon = meta.icon
  const canToggle =
    !isBusy && (Boolean(actionLabel) || user.followStatus !== 'self')
  const buttonLabel = actionLabel ?? meta.label
  const buttonClassName =
    actionClassName ??
    meta.className

  return (
    <article className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        type="button"
        onClick={onOpen}
      >
        <Avatar size={44} src={user.avatar_url} username={user.username} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ig-text">
            {user.username}
          </span>
          <span className="block truncate text-sm text-ig-muted">
            {user.full_name || 'Instagram Clone'}
          </span>
        </span>
      </button>

      <button
        className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
        type="button"
        disabled={!canToggle}
        onClick={onToggle}
      >
        {isBusy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : actionLabel ? null : (
          <Icon size={16} />
        )}
        <span className={actionLabel ? 'inline' : 'hidden min-[420px]:inline'}>
          {buttonLabel}
        </span>
      </button>
    </article>
  )
}

export function FollowListModal({
  username,
  kind,
  onClose,
  onOwnFollowersDelta,
  onOwnFollowingDelta,
}: FollowListModalProps) {
  const navigate = useNavigate()
  const myUsername = useAuthStore((state) => state.user?.profile.username)
  const [users, setUsers] = useState<FollowListUser[]>([])
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [busyUsername, setBusyUsername] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const isOwnProfile = username === myUsername

  const enrichUsers = useCallback(
    async (items: ProfileSearchUser[]) => {
      return Promise.all(
        items.map(async (item) => {
          if (item.username === myUsername) {
            return {
              ...item,
              followStatus: 'self' as FollowStatus,
            }
          }

          try {
            const details = await getProfile(item.username, 1, 0)

            return {
              ...item,
              followStatus: statusFromProfile(
                item,
                myUsername,
                details.profile.is_following,
                details.profile.is_follow_requested,
              ),
            }
          } catch {
            return {
              ...item,
              followStatus: statusFromProfile(item, myUsername),
            }
          }
        }),
      )
    },
    [myUsername],
  )

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      setError(null)

      try {
        const data =
          kind === 'followers'
            ? await getFollowers(username, FOLLOW_LIMIT, nextOffset)
            : await getFollowing(username, FOLLOW_LIMIT, nextOffset)
        const enriched = await enrichUsers(data.users)

        if (requestIdRef.current !== requestId) {
          return
        }

        setUsers((current) =>
          append ? [...current, ...enriched] : enriched,
        )
        setOffset(nextOffset + data.users.length)
        setHasNext(data.has_next)
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setError(getApiError(error))
          if (!append) {
            setUsers([])
          }
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [enrichUsers, kind, username],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPage(0, false)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPage])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return users
    }

    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(needle) ||
        (user.full_name ?? '').toLowerCase().includes(needle),
    )
  }, [query, users])

  function openProfile(profileUsername: string) {
    onClose()
    navigate(`/profile/${profileUsername}`)
  }

  async function handleToggleFollow(user: FollowListUser) {
    if (user.followStatus === 'self') {
      return
    }

    setBusyUsername(user.username)
    setError(null)

    try {
      const previousStatus = user.followStatus
      let nextStatus: FollowStatus = 'idle'

      if (
        user.followStatus === 'following' ||
        user.followStatus === 'requested'
      ) {
        await unfollowProfile(user.username)
      } else {
        const response = await followProfile(user.username)
        nextStatus = response.follow.is_accepted ? 'following' : 'requested'
      }

      setUsers((items) =>
        items.map((item) =>
          item.username === user.username
            ? { ...item, followStatus: nextStatus }
            : item,
        ),
      )

      if (isOwnProfile) {
        if (previousStatus === 'following' && nextStatus !== 'following') {
          onOwnFollowingDelta?.(-1)
        }

        if (previousStatus !== 'following' && nextStatus === 'following') {
          onOwnFollowingDelta?.(1)
        }
      }
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusyUsername(null)
    }
  }

  async function handleRemoveFollower(user: FollowListUser) {
    setBusyUsername(user.username)
    setError(null)

    try {
      await removeFollower(user.username)
      setUsers((items) =>
        items.filter((item) => item.username !== user.username),
      )
      onOwnFollowersDelta?.(-1)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusyUsername(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[1px] animate-[igOverlayFadeIn_120ms_ease-out]"
      onMouseDown={onClose}
    >
      <section
        className="flex max-h-[78svh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-ig-border bg-[#26272B] shadow-2xl animate-[igActionSheetIn_160ms_cubic-bezier(0.2,0.8,0.2,1)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titleFromKind(kind)}
      >
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-ig-border px-12">
          <h2 className="truncate text-base font-bold">{titleFromKind(kind)}</h2>
          <button
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ig-text transition hover:bg-white/10"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </header>

        <div className="shrink-0 border-b border-ig-border px-4 py-3">
          <label className="flex h-10 items-center gap-3 rounded-lg bg-[#36373B] px-3">
            <Search size={19} className="shrink-0 text-ig-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ig-muted"
              placeholder="Поиск"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {error && (
          <p className="mx-4 mt-3 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {isLoading && (
            <div className="space-y-1 px-4 py-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="flex items-center gap-3 py-2" key={index}>
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-ig-elevated" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-36 animate-pulse rounded-full bg-ig-elevated" />
                    <div className="h-3 w-28 animate-pulse rounded-full bg-ig-elevated" />
                  </div>
                  <div className="h-9 w-28 animate-pulse rounded-lg bg-ig-elevated" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredUsers.length === 0 && (
            <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-ig-muted">
              {query.trim() ? 'Ничего не найдено' : 'Список пока пуст'}
            </div>
          )}

          {!isLoading &&
            filteredUsers.map((item) => {
              const canRemoveFollower =
                isOwnProfile &&
                kind === 'followers' &&
                item.followStatus !== 'self'

              return (
                <FollowRow
                  actionClassName={
                    canRemoveFollower
                      ? 'bg-ig-elevated text-ig-text hover:bg-[#2A2A2A]'
                      : undefined
                  }
                  actionLabel={canRemoveFollower ? 'Удалить' : undefined}
                  isBusy={busyUsername === item.username}
                  key={item.username}
                  user={item}
                  onOpen={() => openProfile(item.username)}
                  onToggle={() =>
                    void (canRemoveFollower
                      ? handleRemoveFollower(item)
                      : handleToggleFollow(item))
                  }
                />
              )
            })}

          {!isLoading && hasNext && !query.trim() && (
            <button
              className="mx-auto my-3 flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold text-ig-primary transition hover:bg-white/[0.04] disabled:opacity-50"
              type="button"
              disabled={isLoadingMore}
              onClick={() => void loadPage(offset, true)}
            >
              {isLoadingMore ? 'Загружаем...' : 'Показать ещё'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
