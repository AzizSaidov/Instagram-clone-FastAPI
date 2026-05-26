import {
  ChevronDown,
  Info,
  Loader2,
  LogOut,
  Paperclip,
  PenSquare,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  UserMinus,
  X,
} from 'lucide-react'
import axios from 'axios'
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createNote, deleteMyNote, getMyNote, getNotes } from '../api/feed'
import {
  addGroupMember,
  deleteGroup,
  getGroup,
  getGroupMembers,
  leaveGroup,
  removeGroupMember,
  updateGroup,
} from '../api/messages'
import { Avatar } from '../components/Avatar'
import { TimeAgo } from '../components/TimeAgo'
import { useWebSocket, type RealtimeEvent } from '../hooks/useWebSocket'
import { useAuthStore } from '../store/authStore'
import { useMessagesStore } from '../store/messagesStore'
import type { Note } from '../types/feed'
import type {
  ActiveConversation,
  Chat,
  DirectMessage,
  FollowRequestUser,
  Group,
} from '../types/messages'
import { getApiError } from '../utils/apiError'
import { mediaUrl, isVideoUrl } from '../utils/media'

type LeftTab = 'messages' | 'requests'

function conversationKey(active: ActiveConversation | null) {
  return active ? `${active.kind}:${active.id}` : ''
}

function getChatCompanion(chat: Chat, myUserId: number | undefined) {
  return chat.user_1.id === myUserId ? chat.user_2 : chat.user_1
}

function lastMessageText(message: DirectMessage | null) {
  if (!message) {
    return 'Нет сообщений'
  }

  if (message.text) {
    return message.text
  }

  return message.media_url ? 'отправил(-а) вложение.' : 'Сообщение'
}

function isUnread(message: DirectMessage | null, myUserId: number | undefined) {
  return Boolean(message && !message.is_read && message.sender.id !== myUserId)
}

function MessagePreview({
  message,
  myUserId,
  isGroup = false,
}: {
  message: DirectMessage | null
  myUserId: number | undefined
  isGroup?: boolean
}) {
  if (!message) {
    return <p className="truncate text-[15px] text-ig-muted">Нет сообщений</p>
  }

  const prefix =
    message.sender.id === myUserId
      ? 'Вы: '
      : isGroup
        ? `${message.sender.username}: `
        : ''

  return (
    <p className="flex min-w-0 items-center gap-1 text-[15px] text-ig-muted">
      <span className="min-w-0 truncate">
        {prefix}
        {lastMessageText(message)}
      </span>
      <span className="shrink-0 text-ig-faint">·</span>
      <TimeAgo
        className="shrink-0 text-[13px] text-ig-muted"
        value={message.created_at}
      />
    </p>
  )
}

function ConversationAvatar({
  title,
  src,
  size = 44,
}: {
  title: string
  src?: string | null
  size?: 32 | 44 | 56
}) {
  return <Avatar size={size} src={src} username={title} />
}

function MessageBubble({
  message,
  isMine,
}: {
  message: DirectMessage
  isMine: boolean
}) {
  const resolvedMedia = mediaUrl(message.media_url)

  return (
    <article
      className={`flex max-w-[74%] flex-col gap-1 ${
        isMine ? 'ml-auto items-end' : 'mr-auto items-start'
      }`}
    >
      {resolvedMedia && (
        <div className="max-w-full overflow-hidden rounded-2xl border border-ig-border bg-ig-elevated">
          {isVideoUrl(message.media_url) ? (
            <video
              className="max-h-72 max-w-full object-cover"
              controls
              src={resolvedMedia}
            />
          ) : (
            <img
              className="max-h-72 max-w-full object-cover"
              src={resolvedMedia}
              alt=""
            />
          )}
        </div>
      )}
      {message.text && (
        <div
          className={`rounded-3xl px-4 py-2 text-sm leading-5 ${
            isMine ? 'bg-[#3797F0] text-white' : 'bg-ig-elevated text-ig-text'
          }`}
        >
          {message.text}
        </div>
      )}
      <TimeAgo className="px-2 text-[11px] text-ig-faint" value={message.created_at} />
    </article>
  )
}

function ChatRow({
  chat,
  isActive,
  myUserId,
  onClick,
}: {
  chat: Chat
  isActive: boolean
  myUserId: number | undefined
  onClick: () => void
}) {
  const companion = getChatCompanion(chat, myUserId)

  return (
    <button
      className={`flex w-full items-center gap-4 px-8 py-3 text-left transition hover:bg-ig-elevated ${
        isActive ? 'bg-ig-elevated' : ''
      }`}
      type="button"
      onClick={onClick}
    >
      <ConversationAvatar
        title={companion.username}
        src={companion.avatar_url}
        size={56}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ig-text">
          {companion.username}
        </p>
        <MessagePreview message={chat.last_message} myUserId={myUserId} />
      </div>
      {isUnread(chat.last_message, myUserId) && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#5B5CE2]" />
      )}
    </button>
  )
}

function GroupRow({
  group,
  isActive,
  myUserId,
  onClick,
}: {
  group: Group
  isActive: boolean
  myUserId: number | undefined
  onClick: () => void
}) {
  return (
    <button
      className={`flex w-full items-center gap-4 px-8 py-3 text-left transition hover:bg-ig-elevated ${
        isActive ? 'bg-ig-elevated' : ''
      }`}
      type="button"
      onClick={onClick}
    >
      <ConversationAvatar title={group.name} src={group.avatar_url} size={56} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ig-text">
          {group.name}
        </p>
        <MessagePreview
          isGroup
          message={group.last_message}
          myUserId={myUserId}
        />
      </div>
      {isUnread(group.last_message, myUserId) && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#5B5CE2]" />
      )}
    </button>
  )
}

function FollowRequestRow({
  user,
  onAccept,
  onReject,
}: {
  user: FollowRequestUser
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <article className="flex items-center gap-3 px-6 py-3">
      <ConversationAvatar title={user.username} src={user.avatar_url} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="truncate text-sm text-ig-muted">
          {user.full_name ?? 'хочет подписаться'}
        </p>
      </div>
      <button
        className="rounded-lg bg-ig-primary px-3 py-1.5 text-xs font-semibold text-white"
        type="button"
        onClick={onAccept}
      >
        Подтвердить
      </button>
      <button
        className="rounded-lg bg-ig-elevated px-3 py-1.5 text-xs font-semibold text-ig-text"
        type="button"
        onClick={onReject}
      >
        Удалить
      </button>
    </article>
  )
}

function DirectNoteItem({
  title,
  avatarUrl,
  text,
  isPlaceholder = false,
  onClick,
}: {
  title: string
  avatarUrl?: string | null
  text?: string | null
  isPlaceholder?: boolean
  onClick?: () => void
}) {
  const body = text?.trim() || 'Новая заметка...'

  return (
    <button
      className="group w-[94px] shrink-0 text-center"
      type="button"
      onClick={onClick}
    >
      <div className="relative mx-auto h-[96px] w-[88px]">
        <div
          className={`absolute left-1/2 top-0 z-10 max-h-11 min-w-[76px] max-w-[94px] -translate-x-1/2 overflow-hidden rounded-2xl px-3 py-2 text-[11px] font-semibold leading-4 shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition group-hover:bg-[#2A2A2C] ${
            isPlaceholder
              ? 'bg-ig-elevated text-ig-muted'
              : 'bg-[#252529] text-ig-text'
          }`}
        >
          {body}
        </div>
        <span
          className={`absolute left-1/2 top-[42px] z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-ig-bg ${
            isPlaceholder ? 'bg-ig-elevated' : 'bg-[#252529]'
          }`}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <Avatar size={56} src={avatarUrl} username={title} />
        </div>
      </div>
      <span className="mt-1 block truncate text-xs font-semibold text-ig-muted">
        {title}
      </span>
    </button>
  )
}

function DirectNotesStrip({
  username,
  avatarUrl,
  myNote,
  notes,
  onMyNoteClick,
}: {
  username: string
  avatarUrl?: string | null
  myNote: Note | null
  notes: Note[]
  onMyNoteClick: () => void
}) {
  const visibleNotes = notes.filter((note) => note.user.username !== username)

  return (
    <section
      className="mt-5 flex gap-3 overflow-x-auto px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Заметки"
    >
      <DirectNoteItem
        avatarUrl={avatarUrl}
        isPlaceholder={!myNote}
        onClick={onMyNoteClick}
        text={myNote?.text}
        title="Ваша заметка"
      />
      {visibleNotes.map((note) => (
        <DirectNoteItem
          avatarUrl={note.user.avatar_url}
          key={note.id}
          text={note.text}
          title={note.user.username}
        />
      ))}
    </section>
  )
}

function NoteModal({
  currentNote,
  avatarUrl,
  username,
  error,
  isSaving,
  onClose,
  onSave,
  onDelete,
}: {
  currentNote: Note | null
  avatarUrl?: string | null
  username: string
  error: string | null
  isSaving: boolean
  onClose: () => void
  onSave: (text: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [draft, setDraft] = useState(currentNote?.text ?? '')
  const trimmed = draft.trim()
  const canSave = trimmed.length > 0 && trimmed.length <= 60 && !isSaving

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (canSave) {
      await onSave(trimmed)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-ig-border bg-ig-surface shadow-2xl"
        onSubmit={handleSubmit}
      >
        <header className="flex h-12 items-center justify-between border-b border-ig-border px-4">
          <button
            className="rounded-full p-2 text-ig-muted transition hover:bg-ig-elevated hover:text-ig-text"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          <h2 className="text-sm font-semibold">Ваша заметка</h2>
          <button
            className="text-sm font-semibold text-ig-primary disabled:opacity-40"
            type="submit"
            disabled={!canSave}
          >
            Готово
          </button>
        </header>

        <div className="px-6 py-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Avatar size={56} src={avatarUrl} username={username} />
          </div>
          <textarea
            className="h-24 w-full resize-none rounded-2xl border border-ig-border bg-ig-bg px-4 py-3 text-center text-base outline-none placeholder:text-ig-faint focus:border-ig-faint"
            maxLength={60}
            placeholder="Поделитесь мыслью"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-ig-muted">
            <span>Заметка исчезнет через 24 часа</span>
            <span>{draft.trim().length}/60</span>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-ig-danger/10 px-3 py-2 text-xs text-ig-danger">
              {error}
            </p>
          )}
        </div>

        {currentNote && (
          <div className="border-t border-ig-border px-4 py-3">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ig-danger transition hover:bg-ig-elevated disabled:opacity-40"
              type="button"
              disabled={isSaving}
              onClick={() => void onDelete()}
            >
              <Trash2 size={17} />
              Удалить заметку
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

function GroupInfoModal({
  group,
  myUserId,
  onClose,
  onGroupChanged,
  onGroupRemoved,
}: {
  group: Group
  myUserId: number | undefined
  onClose: () => void
  onGroupChanged: (group: Group) => void
  onGroupRemoved: (groupId: number) => void
}) {
  const [members, setMembers] = useState<DirectMessage['sender'][]>([])
  const [groupName, setGroupName] = useState(group.name)
  const [avatarUrl, setAvatarUrl] = useState(group.avatar_url ?? '')
  const [query, setQuery] = useState('')
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const searchResults = useMessagesStore((state) => state.searchResults)
  const isSearching = useMessagesStore((state) => state.isSearching)
  const searchUsers = useMessagesStore((state) => state.searchUsers)
  const isOwner = group.owner.id === myUserId
  const memberUsernames = new Set(members.map((member) => member.username))
  const addableUsers = searchResults.filter(
    (result) => !memberUsernames.has(result.username),
  )

  const loadMembers = useCallback(async () => {
    setIsLoadingMembers(true)
    setError(null)

    try {
      const data = await getGroupMembers(group.id, 80, 0)
      setMembers(data.users)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsLoadingMembers(false)
    }
  }, [group.id])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadMembers])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGroupName(group.name)
      setAvatarUrl(group.avatar_url ?? '')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [group.avatar_url, group.name])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchUsers(query)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, searchUsers])

  async function refreshGroup() {
    const data = await getGroup(group.id)
    onGroupChanged(data.group)
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isOwner || !groupName.trim()) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const data = await updateGroup(group.id, {
        name: groupName.trim(),
        avatar_url: avatarUrl.trim() || null,
      })
      onGroupChanged(data.group)
      setMessage('Группа обновлена')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddMember(username: string) {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const data = await addGroupMember(group.id, username)
      onGroupChanged(data.group)
      setQuery('')
      setMessage(`${username} добавлен`)
      await loadMembers()
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveMember(username: string) {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      await removeGroupMember(group.id, username)
      setMembers((items) => items.filter((item) => item.username !== username))
      await refreshGroup()
      setMessage(`${username} удалён`)
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLeave() {
    setIsSaving(true)
    setError(null)

    try {
      await leaveGroup(group.id)
      onGroupRemoved(group.id)
    } catch (error) {
      setError(getApiError(error))
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsSaving(true)
    setError(null)

    try {
      await deleteGroup(group.id)
      onGroupRemoved(group.id)
    } catch (error) {
      setError(getApiError(error))
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <section className="flex max-h-[88svh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ig-border bg-ig-surface shadow-2xl">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-ig-border px-4">
          <h2 className="font-semibold">Информация о группе</h2>
          <button
            className="rounded-full p-2 transition hover:bg-ig-elevated"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {(error || message) && (
            <p
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                error
                  ? 'border-ig-danger/50 bg-ig-danger/10'
                  : 'border-ig-primary/40 bg-ig-primary/10'
              }`}
            >
              {error ?? message}
            </p>
          )}

          <form className="space-y-3" onSubmit={handleUpdate}>
            <div className="flex items-center gap-3">
              <ConversationAvatar title={group.name} src={avatarUrl} size={56} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{group.name}</p>
                <p className="text-xs text-ig-muted">
                  {group.members_count} участников
                </p>
              </div>
            </div>
            <input
              className="h-10 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint disabled:opacity-60"
              disabled={!isOwner}
              maxLength={100}
              placeholder="Название группы"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
            <input
              className="h-10 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint disabled:opacity-60"
              disabled={!isOwner}
              maxLength={255}
              placeholder="Ссылка на аватар группы"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
            {isOwner && (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-ig-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-40"
                type="submit"
                disabled={isSaving || !groupName.trim()}
              >
                {isSaving && <Loader2 className="animate-spin" size={15} />}
                Сохранить
              </button>
            )}
          </form>

          {isOwner && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold">Добавить участника</h3>
              <label className="mt-2 flex h-10 items-center gap-2 rounded-lg bg-ig-elevated px-3">
                <Search size={17} className="text-ig-muted" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ig-faint"
                  placeholder="Поиск username"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {query.trim() && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-ig-border">
                  {isSearching && (
                    <p className="px-3 py-4 text-center text-sm text-ig-muted">
                      Поиск...
                    </p>
                  )}
                  {!isSearching && addableUsers.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-ig-muted">
                      Ничего не найдено
                    </p>
                  )}
                  {!isSearching &&
                    addableUsers.map((result) => (
                      <button
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-ig-elevated"
                        key={result.username}
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleAddMember(result.username)}
                      >
                        <ConversationAvatar
                          title={result.username}
                          src={result.avatar_url}
                          size={32}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {result.username}
                        </span>
                        <Plus size={17} />
                      </button>
                    ))}
                </div>
              )}
            </section>
          )}

          <section className="mt-6">
            <h3 className="text-sm font-semibold">Участники</h3>
            <div className="mt-2 divide-y divide-ig-border">
              {isLoadingMembers && (
                <p className="py-4 text-sm text-ig-muted">Загружаем...</p>
              )}
              {!isLoadingMembers &&
                members.map((member) => (
                  <div className="flex items-center gap-3 py-3" key={member.id}>
                    <ConversationAvatar
                      title={member.username}
                      src={member.avatar_url}
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.username}</p>
                      {member.id === group.owner.id && (
                        <p className="text-xs text-ig-muted">Владелец</p>
                      )}
                    </div>
                    {isOwner && member.id !== group.owner.id && (
                      <button
                        className="rounded-full p-2 text-ig-muted transition hover:bg-ig-elevated hover:text-ig-danger"
                        type="button"
                        disabled={isSaving}
                        aria-label="Удалить участника"
                        onClick={() => void handleRemoveMember(member.username)}
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-ig-border px-4 py-3">
          {isOwner ? (
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ig-elevated text-sm font-semibold text-ig-danger transition hover:bg-[#2A2A2A] disabled:opacity-40"
              type="button"
              disabled={isSaving}
              onClick={() => void handleDelete()}
            >
              <Trash2 size={17} />
              Удалить группу
            </button>
          ) : (
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ig-elevated text-sm font-semibold text-ig-danger transition hover:bg-[#2A2A2A] disabled:opacity-40"
              type="button"
              disabled={isSaving}
              onClick={() => void handleLeave()}
            >
              <LogOut size={17} />
              Выйти из группы
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}

function NewChatModal({
  onClose,
  onCreateGroup,
  onStart,
}: {
  onClose: () => void
  onCreateGroup: (payload: {
    name: string
    avatarUrl?: string | null
    memberUsernames: string[]
  }) => Promise<void>
  onStart: (username: string) => void
}) {
  const user = useAuthStore((state) => state.user)
  const [mode, setMode] = useState<'chat' | 'group'>('chat')
  const [query, setQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupAvatar, setGroupAvatar] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<FollowRequestUser[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const searchResults = useMessagesStore((state) => state.searchResults)
  const isSearching = useMessagesStore((state) => state.isSearching)
  const searchUsers = useMessagesStore((state) => state.searchUsers)
  const selectedUsernames = new Set(selectedUsers.map((item) => item.username))
  const visibleSearchResults = searchResults.filter(
    (result) =>
      result.username !== user?.profile.username &&
      !selectedUsernames.has(result.username),
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchUsers(query)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, searchUsers])

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!groupName.trim() || isCreating) {
      return
    }

    setIsCreating(true)

    try {
      await onCreateGroup({
        name: groupName.trim(),
        avatarUrl: groupAvatar.trim() || null,
        memberUsernames: selectedUsers.map((item) => item.username),
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-ig-border bg-ig-surface shadow-2xl">
        <header className="flex h-14 items-center justify-between border-b border-ig-border px-4">
          <h2 className="font-semibold">
            {mode === 'chat' ? 'Новое сообщение' : 'Новая группа'}
          </h2>
          <button
            className="rounded-full p-2 transition hover:bg-ig-elevated"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="grid grid-cols-2 border-b border-ig-border">
          {(['chat', 'group'] as const).map((item) => (
            <button
              className={`h-11 text-sm font-semibold transition ${
                mode === item
                  ? 'border-b border-ig-text text-ig-text'
                  : 'text-ig-muted hover:text-ig-text'
              }`}
              key={item}
              type="button"
              onClick={() => {
                setMode(item)
                setQuery('')
              }}
            >
              {item === 'chat' ? 'Чат' : 'Группа'}
            </button>
          ))}
        </div>
        {mode === 'group' && (
          <form className="border-b border-ig-border px-4 py-3" onSubmit={handleCreateGroup}>
            <input
              className="h-10 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint"
              maxLength={100}
              placeholder="Название группы"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
            <input
              className="mt-2 h-10 w-full rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint"
              maxLength={255}
              placeholder="Ссылка на аватар группы (необязательно)"
              value={groupAvatar}
              onChange={(event) => setGroupAvatar(event.target.value)}
            />
            {selectedUsers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedUsers.map((selectedUser) => (
                  <button
                    className="inline-flex h-8 items-center gap-2 rounded-full bg-ig-elevated px-3 text-xs font-semibold"
                    key={selectedUser.username}
                    type="button"
                    onClick={() =>
                      setSelectedUsers((items) =>
                        items.filter((item) => item.username !== selectedUser.username),
                      )
                    }
                  >
                    {selectedUser.username}
                    <X size={13} />
                  </button>
                ))}
              </div>
            )}
            <button
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-ig-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-40"
              type="submit"
              disabled={!groupName.trim() || isCreating}
            >
              {isCreating && <Loader2 className="animate-spin" size={15} />}
              Создать группу
            </button>
          </form>
        )}
        <div className="border-b border-ig-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-ig-elevated px-3 py-2">
            <Search size={18} className="text-ig-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ig-faint"
              placeholder={mode === 'chat' ? 'Поиск' : 'Добавить участников'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {query.trim().length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ig-muted">
              {mode === 'chat'
                ? 'Введите username, чтобы начать чат.'
                : 'Найдите людей и добавьте их в группу.'}
            </p>
          )}
          {query.trim().length > 0 && isSearching && (
            <p className="px-4 py-8 text-center text-sm text-ig-muted">Поиск...</p>
          )}
          {query.trim().length > 0 && !isSearching && visibleSearchResults.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ig-muted">
              Ничего не найдено
            </p>
          )}
          {visibleSearchResults.map((result) => (
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ig-elevated"
              key={result.username}
              type="button"
              onClick={() => {
                if (mode === 'chat') {
                  onStart(result.username)
                  return
                }

                setSelectedUsers((items) => [...items, result])
                setQuery('')
              }}
            >
              <ConversationAvatar title={result.username} src={result.avatar_url} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{result.username}</p>
                <p className="truncate text-sm text-ig-muted">
                  {result.full_name ?? 'Instagram user'}
                </p>
              </div>
              {mode === 'group' && (
                <Plus className="ml-auto shrink-0 text-ig-muted" size={18} />
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export function MessagesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loadMe = useAuthStore((state) => state.loadMe)
  const chats = useMessagesStore((state) => state.chats)
  const groups = useMessagesStore((state) => state.groups)
  const followRequests = useMessagesStore((state) => state.followRequests)
  const active = useMessagesStore((state) => state.active)
  const messagesByKey = useMessagesStore((state) => state.messagesByKey)
  const isLoadingLists = useMessagesStore((state) => state.isLoadingLists)
  const isLoadingRequests = useMessagesStore((state) => state.isLoadingRequests)
  const isSending = useMessagesStore((state) => state.isSending)
  const error = useMessagesStore((state) => state.error)
  const loadLists = useMessagesStore((state) => state.loadLists)
  const loadFollowRequests = useMessagesStore((state) => state.loadFollowRequests)
  const acceptRequest = useMessagesStore((state) => state.acceptRequest)
  const rejectRequest = useMessagesStore((state) => state.rejectRequest)
  const createGroup = useMessagesStore((state) => state.createGroup)
  const upsertGroup = useMessagesStore((state) => state.upsertGroup)
  const removeGroup = useMessagesStore((state) => state.removeGroup)
  const startChat = useMessagesStore((state) => state.startChat)
  const setActive = useMessagesStore((state) => state.setActive)
  const sendMessage = useMessagesStore((state) => state.sendMessage)
  const receiveDirectMessage = useMessagesStore((state) => state.receiveDirectMessage)
  const receiveGroupMessage = useMessagesStore((state) => state.receiveGroupMessage)
  const [leftTab, setLeftTab] = useState<LeftTab>('messages')
  const [filter, setFilter] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [myNote, setMyNote] = useState<Note | null>(null)
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { subscribe, unsubscribe } = useWebSocket()

  const loadDirectNotes = useCallback(async () => {
    setIsNotesLoading(true)
    setNoteError(null)

    try {
      const [notesData, myNoteData] = await Promise.all([
        getNotes(),
        getMyNote().catch((error) => {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null
          }

          throw error
        }),
      ])

      setNotes(notesData.notes)
      setMyNote(myNoteData?.note ?? null)
    } catch (error) {
      setNoteError(getApiError(error))
    } finally {
      setIsNotesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      void loadMe().catch(() => undefined)
    }
  }, [loadMe, user])

  useEffect(() => {
    void loadLists()
    void loadFollowRequests()
  }, [loadLists, loadFollowRequests])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDirectNotes()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDirectNotes])

  useEffect(() => {
    if (id && Number.isFinite(Number(id))) {
      void setActive({ kind: 'chat', id: Number(id) })
    }
  }, [id, setActive])

  useEffect(() => {
    function handleDirect(event: RealtimeEvent) {
      const chatId = Number(event.chat_id)
      const message = event.message as DirectMessage | undefined

      if (chatId && message) {
        receiveDirectMessage(chatId, message)
      }
    }

    function handleGroup(event: RealtimeEvent) {
      const groupId = Number(event.group_id)
      const message = event.message as DirectMessage | undefined

      if (groupId && message) {
        receiveGroupMessage(groupId, message)
      }
    }

    subscribe('direct_message', handleDirect)
    subscribe('new_message', handleDirect)
    subscribe('group_message', handleGroup)
    subscribe('new_group_message', handleGroup)

    return () => {
      unsubscribe('direct_message', handleDirect)
      unsubscribe('new_message', handleDirect)
      unsubscribe('group_message', handleGroup)
      unsubscribe('new_group_message', handleGroup)
    }
  }, [receiveDirectMessage, receiveGroupMessage, subscribe, unsubscribe])

  const normalizedFilter = filter.trim().toLowerCase()
  const filteredChats = useMemo(
    () =>
      chats.filter((chat) =>
        getChatCompanion(chat, user?.id)
          .username.toLowerCase()
          .includes(normalizedFilter),
      ),
    [chats, normalizedFilter, user?.id],
  )
  const filteredGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.name.toLowerCase().includes(normalizedFilter),
      ),
    [groups, normalizedFilter],
  )
  const activeKey = conversationKey(active)
  const messagesState = activeKey ? messagesByKey[activeKey] : undefined
  const activeChat =
    active?.kind === 'chat'
      ? chats.find((chat) => chat.id === active.id)
      : undefined
  const activeGroup =
    active?.kind === 'group'
      ? groups.find((group) => group.id === active.id)
      : undefined
  const activeTitle = activeChat
    ? getChatCompanion(activeChat, user?.id).username
    : activeGroup?.name
  const activeAvatar = activeChat
    ? getChatCompanion(activeChat, user?.id).avatar_url
    : activeGroup?.avatar_url
  const canSend = Boolean(
    active && (messageText.trim().length > 0 || file) && !isSending,
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messagesState?.items.length, activeKey])

  async function handleStartChat(username: string) {
    const chat = await startChat(username)

    if (chat) {
      setIsNewChatOpen(false)
      navigate(`/messages/${chat.id}`)
    }
  }

  async function handleCreateGroup(payload: {
    name: string
    avatarUrl?: string | null
    memberUsernames: string[]
  }) {
    const group = await createGroup(payload)

    if (group) {
      setIsNewChatOpen(false)
      navigate('/messages')
    }
  }

  function handleGroupRemoved(groupId: number) {
    removeGroup(groupId)
    setIsGroupInfoOpen(false)
    navigate('/messages')
  }

  async function handleSaveNote(text: string) {
    setIsSavingNote(true)
    setNoteError(null)

    try {
      const { note } = await createNote(text)
      setMyNote(note)
      setNotes((items) => [
        note,
        ...items.filter((item) => item.user.username !== note.user.username),
      ])
      setIsNoteModalOpen(false)
    } catch (error) {
      setNoteError(getApiError(error))
    } finally {
      setIsSavingNote(false)
    }
  }

  async function handleDeleteNote() {
    setIsSavingNote(true)
    setNoteError(null)

    try {
      await deleteMyNote()
      setMyNote(null)
      setNotes((items) =>
        items.filter((item) => item.user.username !== user?.profile.username),
      )
      setIsNoteModalOpen(false)
    } catch (error) {
      setNoteError(getApiError(error))
    } finally {
      setIsSavingNote(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!active || !canSend) {
      return
    }

    await sendMessage(active, {
      text: messageText.trim() || undefined,
      file,
    })
    setMessageText('')
    setFile(null)
  }

  return (
    <main className="flex h-svh overflow-hidden bg-ig-bg text-ig-text">
      <aside className="flex w-full shrink-0 flex-col border-r border-ig-border bg-[#0B0C10] md:w-[540px] xl:w-[560px]">
        <header className="flex h-[88px] items-center justify-between px-8 pt-2">
          <button
            className="flex min-w-0 items-center gap-2 rounded-lg py-2 text-left transition hover:text-ig-muted"
            type="button"
          >
            <h1 className="truncate text-xl font-bold">
              {user?.profile.username ?? 'Сообщения'}
            </h1>
            <ChevronDown className="shrink-0" size={18} />
          </button>
          <button
            className="rounded-full p-2 transition hover:bg-ig-elevated"
            type="button"
            aria-label="Новый чат"
            onClick={() => setIsNewChatOpen(true)}
          >
            <PenSquare size={23} />
          </button>
        </header>

        <div className="px-6">
          <label className="flex h-12 items-center gap-3 rounded-[18px] bg-[#24262D] px-5">
            <Search size={20} className="text-ig-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ig-muted"
              placeholder="Поиск"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
        </div>

        {isNotesLoading ? (
          <section className="mt-5 flex gap-3 overflow-hidden px-6 pb-3">
            {[0, 1, 2, 3].map((item) => (
              <div className="w-[94px] shrink-0" key={item}>
                <div className="mx-auto h-[96px] w-[88px] animate-pulse rounded-3xl bg-ig-elevated" />
                <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded-full bg-ig-elevated" />
              </div>
            ))}
          </section>
        ) : (
          <DirectNotesStrip
            avatarUrl={user?.profile.avatar_url}
            myNote={myNote}
            notes={notes}
            onMyNoteClick={() => {
              setNoteError(null)
              setIsNoteModalOpen(true)
            }}
            username={user?.profile.username ?? 'Вы'}
          />
        )}

        <div className="flex items-center justify-between px-8 pb-2 pt-1">
          <button
            className={`text-xl font-bold transition ${
              leftTab === 'messages'
                ? 'text-ig-text'
                : 'text-ig-muted hover:text-ig-text'
            }`}
            type="button"
            onClick={() => setLeftTab('messages')}
          >
            Сообщения
          </button>
          <button
            className={`text-base font-bold transition ${
              leftTab === 'requests'
                ? 'text-ig-text'
                : 'text-ig-muted hover:text-ig-text'
            }`}
            type="button"
            onClick={() => setLeftTab('requests')}
          >
            Запросы
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {error && (
            <div className="mx-4 mb-3 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-xs">
              {error}
            </div>
          )}

          {leftTab === 'messages' && isLoadingLists && (
            <p className="px-6 py-8 text-center text-sm text-ig-muted">
              Загружаем чаты...
            </p>
          )}

          {leftTab === 'messages' && !isLoadingLists && (
            <>
              {filteredChats.map((chat) => (
                <ChatRow
                  chat={chat}
                  isActive={active?.kind === 'chat' && active.id === chat.id}
                  key={`chat-${chat.id}`}
                  myUserId={user?.id}
                  onClick={() => {
                    navigate(`/messages/${chat.id}`)
                    void setActive({ kind: 'chat', id: chat.id })
                  }}
                />
              ))}
              {filteredGroups.map((group) => (
                <GroupRow
                  group={group}
                  isActive={active?.kind === 'group' && active.id === group.id}
                  key={`group-${group.id}`}
                  myUserId={user?.id}
                  onClick={() => {
                    navigate('/messages')
                    void setActive({ kind: 'group', id: group.id })
                  }}
                />
              ))}
              {filteredChats.length === 0 && filteredGroups.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-ig-muted">
                  Чатов пока нет
                </p>
              )}
            </>
          )}

          {leftTab === 'requests' && isLoadingRequests && (
            <p className="px-6 py-8 text-center text-sm text-ig-muted">
              Загружаем запросы...
            </p>
          )}
          {leftTab === 'requests' && !isLoadingRequests && (
            <>
              {followRequests.map((request) => (
                <FollowRequestRow
                  key={request.username}
                  user={request}
                  onAccept={() => void acceptRequest(request.username)}
                  onReject={() => void rejectRequest(request.username)}
                />
              ))}
              {followRequests.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-ig-muted">
                  Запросов нет
                </p>
              )}
            </>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!active && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <MessageIcon />
            <h2 className="mt-5 text-xl font-semibold">Ваши сообщения</h2>
            <p className="mt-2 text-sm text-ig-muted">
              Отправляйте личные сообщения и медиафайлы.
            </p>
            <button
              className="mt-5 rounded-lg bg-ig-primary px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={() => setIsNewChatOpen(true)}
            >
              Отправить сообщение
            </button>
          </div>
        )}

        {active && (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ig-border px-5">
              <ConversationAvatar title={activeTitle ?? 'Чат'} src={activeAvatar} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {activeTitle ?? 'Чат'}
                </p>
              {activeGroup && (
                  <p className="text-xs text-ig-muted">
                    {activeGroup.members_count} участников
                  </p>
                )}
              </div>
              <button
                className="rounded-full p-2 text-ig-muted transition hover:bg-ig-elevated hover:text-ig-text"
                type="button"
                aria-label="Информация"
                onClick={() => {
                  if (activeGroup) {
                    setIsGroupInfoOpen(true)
                  }
                }}
              >
                <Info size={22} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {messagesState?.isLoading && (
                <p className="py-8 text-center text-sm text-ig-muted">
                  Загружаем сообщения...
                </p>
              )}
              {!messagesState?.isLoading &&
                (messagesState?.items.length ?? 0) === 0 && (
                  <p className="py-8 text-center text-sm text-ig-muted">
                    Сообщений пока нет
                  </p>
                )}
              <div className="space-y-3">
                {messagesState?.items.map((message) => (
                  <MessageBubble
                    isMine={message.sender.id === user?.id}
                    key={message.id}
                    message={message}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form
              className="shrink-0 border-t border-ig-border px-5 py-4"
              onSubmit={handleSend}
            >
              {file && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-ig-elevated px-3 py-1 text-xs text-ig-muted">
                  <span className="max-w-[220px] truncate">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex min-h-11 items-center gap-3 rounded-full border border-ig-border px-4">
                <Smile size={21} className="shrink-0 text-ig-muted" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ig-faint"
                  maxLength={1000}
                  placeholder="Написать сообщение..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />
                <label className="cursor-pointer rounded-full p-1 text-ig-muted transition hover:text-ig-text">
                  <Paperclip size={21} />
                  <input
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4"
                    onChange={handleFileChange}
                  />
                </label>
                <button
                  className="rounded-full p-1 text-ig-primary transition hover:bg-ig-elevated disabled:cursor-not-allowed disabled:opacity-40"
                  type="submit"
                  disabled={!canSend}
                  aria-label="Отправить"
                >
                  <Send size={21} />
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      {isNewChatOpen && (
        <NewChatModal
          onClose={() => setIsNewChatOpen(false)}
          onCreateGroup={handleCreateGroup}
          onStart={(username) => void handleStartChat(username)}
        />
      )}

      {isGroupInfoOpen && activeGroup && (
        <GroupInfoModal
          group={activeGroup}
          myUserId={user?.id}
          onClose={() => setIsGroupInfoOpen(false)}
          onGroupChanged={upsertGroup}
          onGroupRemoved={handleGroupRemoved}
        />
      )}

      {isNoteModalOpen && (
        <NoteModal
          avatarUrl={user?.profile.avatar_url}
          currentNote={myNote}
          error={noteError}
          isSaving={isSavingNote}
          onClose={() => setIsNoteModalOpen(false)}
          onDelete={handleDeleteNote}
          onSave={handleSaveNote}
          username={user?.profile.username ?? 'Вы'}
        />
      )}
    </main>
  )
}

function MessageIcon() {
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
      <Send size={42} />
    </div>
  )
}
