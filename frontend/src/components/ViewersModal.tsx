import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProfileSearchUser } from '../types/profiles'
import { getApiError } from '../utils/apiError'
import { Avatar } from './Avatar'

interface ViewersModalProps {
  title: string
  loadViewers: () => Promise<{ users: ProfileSearchUser[] }>
  onClose: () => void
}

export function ViewersModal({ title, loadViewers, onClose }: ViewersModalProps) {
  const [users, setUsers] = useState<ProfileSearchUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await loadViewers()

        if (isCurrent) {
          setUsers(data.users)
        }
      } catch (error) {
        if (isCurrent) {
          setError(getApiError(error))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isCurrent = false
    }
  }, [loadViewers])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
      <section className="flex max-h-[80svh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-ig-border bg-ig-surface shadow-2xl">
        <header className="flex h-12 items-center justify-between border-b border-ig-border px-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            className="rounded-full p-2 transition hover:bg-ig-elevated"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-[240px] overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <div className="h-11 w-11 rounded-full bg-ig-elevated" />
                  <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-ig-elevated" />
                    <div className="h-3 w-20 rounded bg-ig-elevated" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && error && (
            <p className="rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          {!isLoading && !error && users.length === 0 && (
            <div className="flex min-h-[220px] items-center justify-center text-center text-sm text-ig-muted">
              Просмотров пока нет
            </div>
          )}
          {!isLoading && users.length > 0 && (
            <div className="space-y-4">
              {users.map((user) => (
                <Link
                  className="flex items-center gap-3"
                  key={user.id}
                  to={`/profile/${user.username}`}
                  onClick={onClose}
                >
                  <Avatar
                    size={44}
                    src={user.avatar_url}
                    username={user.username}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {user.username}
                    </p>
                    {user.full_name && (
                      <p className="truncate text-sm text-ig-muted">
                        {user.full_name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
