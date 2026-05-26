import { Check, Clock3, Search, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  followProfile,
  getProfile,
  searchProfiles,
  unfollowProfile,
} from '../api/profiles'
import { Avatar } from '../components/Avatar'
import { useAuthStore } from '../store/authStore'
import type { ProfileSearchUser } from '../types/profiles'
import { getApiError } from '../utils/apiError'

type FollowStatus = 'idle' | 'following' | 'requested' | 'self'

interface SearchResult extends ProfileSearchUser {
  followStatus: FollowStatus
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

function SearchEmpty({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
        <Search size={42} strokeWidth={1.8} />
      </div>
      <h1 className="mt-5 text-xl font-semibold">
        {hasQuery ? 'Ничего не найдено' : 'Поиск'}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ig-muted">
        {hasQuery
          ? 'Попробуйте другой username.'
          : 'Введите username, чтобы найти профиль.'}
      </p>
    </div>
  )
}

function SearchRow({
  user,
  isBusy,
  onFollowClick,
  onOpen,
}: {
  user: SearchResult
  isBusy: boolean
  onFollowClick: () => void
  onOpen: () => void
}) {
  const meta = buttonMeta(user.followStatus)
  const Icon = meta.icon
  const canToggle = user.followStatus !== 'self' && !isBusy

  return (
    <article className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-ig-surface sm:px-3">
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
        className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${meta.className}`}
        type="button"
        disabled={!canToggle}
        onClick={onFollowClick}
      >
        <Icon size={16} />
        <span className="hidden min-[430px]:inline">{meta.label}</span>
      </button>
    </article>
  )
}

export function SearchPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loadMe = useAuthStore((state) => state.loadMe)
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get('q') ?? '',
  )
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [busyUsername, setBusyUsername] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const myUsername = user?.profile.username
  const trimmedQuery = useMemo(() => query.trim(), [query])
  const hasQuery = trimmedQuery.length > 0

  useEffect(() => {
    if (!user) {
      const timer = window.setTimeout(() => {
        void loadMe().catch(() => undefined)
      }, 0)

      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [loadMe, user])

  const runSearch = useCallback(
    async (searchQuery: string, requestId: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await searchProfiles(searchQuery)
        const enriched = await Promise.all(
          data.users.map(async (profileUser) => {
            try {
              const details = await getProfile(profileUser.username, 1, 0)

              return {
                ...profileUser,
                followStatus: statusFromProfile(
                  profileUser,
                  myUsername,
                  details.profile.is_following,
                  details.profile.is_follow_requested,
                ),
              }
            } catch {
              return {
                ...profileUser,
                followStatus: statusFromProfile(profileUser, myUsername),
              }
            }
          }),
        )

        if (requestIdRef.current === requestId) {
          setResults(enriched)
        }
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setResults([])
          setError(getApiError(error))
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [myUsername],
  )

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const timer = window.setTimeout(
      () => {
        if (!trimmedQuery) {
          setResults([])
          setError(null)
          setIsLoading(false)
          return
        }

        void runSearch(trimmedQuery, requestId)
      },
      trimmedQuery ? 300 : 0,
    )

    return () => window.clearTimeout(timer)
  }, [runSearch, trimmedQuery])

  async function handleFollowClick(result: SearchResult) {
    if (result.followStatus === 'self') {
      return
    }

    setBusyUsername(result.username)
    setError(null)

    try {
      if (result.followStatus === 'following' || result.followStatus === 'requested') {
        await unfollowProfile(result.username)
        setResults((items) =>
          items.map((item) =>
            item.username === result.username
              ? { ...item, followStatus: 'idle' }
              : item,
          ),
        )
      } else {
        const response = await followProfile(result.username)
        setResults((items) =>
          items.map((item) =>
            item.username === result.username
              ? {
                  ...item,
                  followStatus: response.follow.is_accepted
                    ? 'following'
                    : 'requested',
                }
              : item,
          ),
        )
      }
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusyUsername(null)
    }
  }

  return (
    <main className="min-h-svh bg-ig-bg px-4 pb-20 pt-8 text-ig-text sm:px-8">
      <section className="mx-auto w-full max-w-[640px]">
        <h1 className="text-2xl font-bold">Поиск</h1>

        <label className="mt-7 flex h-12 items-center gap-3 rounded-xl bg-ig-elevated px-4">
          <Search size={20} className="shrink-0 text-ig-muted" />
          <input
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ig-faint"
            placeholder="Поиск"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              className="rounded-full p-1 text-ig-muted transition hover:bg-ig-border hover:text-ig-text"
              type="button"
              aria-label="Очистить поиск"
              onClick={() => setQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </label>

        {error && (
          <div className="mt-5 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="mt-5 border-t border-ig-border pt-2">
          {isLoading && (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="flex items-center gap-3 rounded-lg px-2 py-3 sm:px-3"
                  key={index}
                >
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-ig-elevated" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-36 animate-pulse rounded-full bg-ig-elevated" />
                    <div className="h-3 w-48 animate-pulse rounded-full bg-ig-elevated" />
                  </div>
                  <div className="h-8 w-28 animate-pulse rounded-lg bg-ig-elevated" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <SearchEmpty hasQuery={hasQuery} />
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result) => (
                <SearchRow
                  isBusy={busyUsername === result.username}
                  key={result.username}
                  user={result}
                  onFollowClick={() => void handleFollowClick(result)}
                  onOpen={() => navigate(`/profile/${result.username}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
