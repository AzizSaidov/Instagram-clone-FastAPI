import axios from 'axios'
import {
  Camera,
  Lock,
  LogOut,
  Loader2,
  ShieldOff,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePasswordRequest } from '../api/auth'
import {
  createNote,
  deleteMyNote,
  getMyNote,
} from '../api/feed'
import {
  deleteMyAvatar,
  getBlockedProfiles,
  unblockProfile,
  updateMyProfile,
  uploadMyAvatar,
} from '../api/profiles'
import { Avatar } from '../components/Avatar'
import { useAuthStore } from '../store/authStore'
import type { Note } from '../types/feed'
import type { ProfileSearchUser } from '../types/profiles'
import { getApiError } from '../utils/apiError'

type SettingsTab = 'profile' | 'note' | 'blocked' | 'security'

const tabs: Array<{ id: SettingsTab; label: string; icon: LucideIcon }> = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'note', label: 'Заметка', icon: StickyNote },
  { id: 'blocked', label: 'Заблокированные', icon: ShieldOff },
  { id: 'security', label: 'Безопасность', icon: Lock },
]

function isNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loadMe = useAuthStore((state) => state.loadMe)
  const logout = useAuthStore((state) => state.logout)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [username, setUsername] = useState(user?.profile.username ?? '')
  const [fullName, setFullName] = useState(user?.profile.full_name ?? '')
  const [bio, setBio] = useState(user?.profile.bio ?? '')
  const [isPrivate, setIsPrivate] = useState(user?.profile.is_private ?? false)
  const [note, setNote] = useState<Note | null>(null)
  const [noteText, setNoteText] = useState('')
  const [blockedUsers, setBlockedUsers] = useState<ProfileSearchUser[]>([])
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      void loadMe().catch(() => undefined)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setUsername(user.profile.username)
      setFullName(user.profile.full_name ?? '')
      setBio(user.profile.bio ?? '')
      setIsPrivate(user.profile.is_private)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadMe, user])

  useEffect(() => {
    let cancelled = false

    async function loadNote() {
      try {
        const data = await getMyNote()
        if (!cancelled) {
          setNote(data.note)
          setNoteText(data.note.text)
        }
      } catch (error) {
        if (!cancelled && !isNotFound(error)) {
          setError(getApiError(error))
        }
      }
    }

    void loadNote()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'blocked') {
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLoadingBlocked(true)
      setError(null)

      getBlockedProfiles(50, 0)
        .then((data) => {
          if (!cancelled) {
            setBlockedUsers(data.users)
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setError(getApiError(error))
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingBlocked(false)
          }
        })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activeTab])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await updateMyProfile({
        username: username.trim(),
        full_name: fullName.trim(),
        bio: bio.trim(),
        is_private: isPrivate,
      })
      await loadMe()
      setMessage('Профиль обновлен')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await uploadMyAvatar(file)
      await loadMe()
      setMessage('Фото профиля обновлено')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAvatar() {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await deleteMyAvatar()
      await loadMe()
      setMessage('Фото профиля удалено')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = noteText.trim()

    if (!text) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const data = await createNote(text)
      setNote(data.note)
      setNoteText(data.note.text)
      setMessage('Заметка обновлена')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteNote() {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await deleteMyNote()
      setNote(null)
      setNoteText('')
      setMessage('Заметка удалена')
    } catch (error) {
      if (isNotFound(error)) {
        setNote(null)
        setNoteText('')
      } else {
        setError(getApiError(error))
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUnblock(username: string) {
    setError(null)
    setMessage(null)

    try {
      await unblockProfile(username)
      setBlockedUsers((items) => items.filter((item) => item.username !== username))
      setMessage(`${username} разблокирован`)
    } catch (error) {
      setError(getApiError(error))
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await changePasswordRequest({
        old_password: oldPassword,
        new_password: newPassword,
      })
      setOldPassword('')
      setNewPassword('')
      setMessage('Пароль обновлен')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-svh bg-ig-bg px-4 pb-20 pt-8 text-ig-text sm:px-8">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:border-r lg:border-ig-border lg:pr-6">
          <h1 className="text-2xl font-bold">Настройки</h1>
          <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  className={`flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-ig-elevated text-ig-text'
                      : 'text-ig-muted hover:bg-ig-surface hover:text-ig-text'
                  }`}
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setError(null)
                    setMessage(null)
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
          <button
            className="mt-4 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-ig-danger transition hover:bg-ig-surface"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Выйти
          </button>
        </aside>

        <div className="min-w-0">
          {(message || error) && (
            <div
              className={`mb-5 rounded-sm border px-4 py-3 text-sm ${
                error
                  ? 'border-ig-danger/50 bg-ig-danger/10'
                  : 'border-ig-primary/40 bg-ig-primary/10'
              }`}
            >
              {error ?? message}
            </div>
          )}

          {activeTab === 'profile' && user && (
            <form className="max-w-2xl space-y-6" onSubmit={handleProfileSubmit}>
              <section className="flex items-center gap-5">
                <Avatar
                  size={56}
                  src={user.profile.avatar_url}
                  username={user.profile.username}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-ig-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-40"
                    type="button"
                    disabled={isSaving}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={17} />
                    Изменить фото
                  </button>
                  {user.profile.avatar_url && (
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-ig-elevated px-4 text-sm font-semibold text-ig-danger transition hover:bg-[#2A2A2A] disabled:opacity-40"
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleDeleteAvatar()}
                    >
                      <Trash2 size={17} />
                      Удалить фото
                    </button>
                  )}
                  <input
                    ref={avatarInputRef}
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void handleAvatarChange(event)}
                  />
                </div>
              </section>

              <label className="block">
                <span className="text-sm font-semibold">Username</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none focus:border-ig-faint"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Имя</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none focus:border-ig-faint"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Bio</span>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-ig-border bg-ig-bg px-3 py-3 text-sm outline-none focus:border-ig-faint"
                  maxLength={150}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-ig-border bg-ig-bg px-3 py-3">
                <span className="text-sm font-semibold">Закрытый аккаунт</span>
                <input
                  className="h-5 w-5 accent-ig-primary"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                />
              </label>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-ig-primary px-5 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-40"
                type="submit"
                disabled={isSaving || username.trim().length < 3}
              >
                {isSaving && <Loader2 className="animate-spin" size={16} />}
                Сохранить
              </button>
            </form>
          )}

          {activeTab === 'note' && (
            <form className="max-w-lg space-y-4" onSubmit={handleNoteSubmit}>
              <label className="block">
                <span className="text-sm font-semibold">Заметка профиля</span>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-2xl border border-ig-border bg-ig-bg px-4 py-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint"
                  maxLength={60}
                  placeholder="Заметка..."
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                />
              </label>
              <div className="flex items-center justify-between text-xs text-ig-muted">
                <span>Показывается 24 часа</span>
                <span>{noteText.trim().length}/60</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-ig-primary px-5 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-40"
                  type="submit"
                  disabled={isSaving || !noteText.trim()}
                >
                  {isSaving && <Loader2 className="animate-spin" size={16} />}
                  Сохранить
                </button>
                {note && (
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-ig-elevated px-5 text-sm font-semibold text-ig-danger transition hover:bg-[#2A2A2A] disabled:opacity-40"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleDeleteNote()}
                  >
                    <Trash2 size={17} />
                    Удалить
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === 'blocked' && (
            <section className="max-w-2xl">
              {isLoadingBlocked ? (
                <p className="flex items-center gap-2 text-sm text-ig-muted">
                  <Loader2 className="animate-spin" size={16} />
                  Загружаем...
                </p>
              ) : blockedUsers.length === 0 ? (
                <p className="text-sm text-ig-muted">Заблокированных пользователей нет.</p>
              ) : (
                <div className="divide-y divide-ig-border">
                  {blockedUsers.map((blockedUser) => (
                    <div className="flex items-center gap-3 py-3" key={blockedUser.id}>
                      <Avatar
                        size={44}
                        src={blockedUser.avatar_url}
                        username={blockedUser.username}
                      />
                      <button
                        className="min-w-0 flex-1 text-left"
                        type="button"
                        onClick={() => navigate(`/profile/${blockedUser.username}`)}
                      >
                        <p className="truncate text-sm font-semibold">
                          {blockedUser.username}
                        </p>
                      </button>
                      <button
                        className="h-9 rounded-lg bg-ig-elevated px-4 text-sm font-semibold transition hover:bg-[#2A2A2A]"
                        type="button"
                        onClick={() => void handleUnblock(blockedUser.username)}
                      >
                        Разблокировать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'security' && (
            <form className="max-w-lg space-y-4" onSubmit={handlePasswordSubmit}>
              <label className="block">
                <span className="text-sm font-semibold">Старый пароль</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none focus:border-ig-faint"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Новый пароль</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none focus:border-ig-faint"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-ig-primary px-5 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-40"
                type="submit"
                disabled={isSaving || oldPassword.length === 0 || newPassword.length < 8}
              >
                {isSaving && <Loader2 className="animate-spin" size={16} />}
                Обновить пароль
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
