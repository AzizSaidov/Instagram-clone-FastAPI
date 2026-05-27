import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../types/feed'
import { getApiError } from '../utils/apiError'

interface PostActionsSheetProps {
  post: Post
  isOpen: boolean
  canDelete?: boolean
  onClose: () => void
  onToggleSaved: () => Promise<void> | void
  onDelete?: () => Promise<void> | void
  onOpenPost?: () => void
  onOpenViewers?: () => void
  onShareToStory?: () => Promise<void> | void
}

function copyText(value: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value)
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()

  return Promise.resolve()
}

export function PostActionsSheet({
  post,
  isOpen,
  canDelete = false,
  onClose,
  onToggleSaved,
  onDelete,
  onOpenPost,
  onOpenViewers,
  onShareToStory,
}: PostActionsSheetProps) {
  const navigate = useNavigate()
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  async function runAction(action: () => Promise<void> | void) {
    setIsRunning(true)
    setError(null)

    try {
      await action()
      onClose()
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsRunning(false)
    }
  }

  function goToPost() {
    onOpenPost?.()
    onClose()
  }

  function goToAccount() {
    onClose()
    navigate(`/profile/${post.user.username}`)
  }

  const rowClass =
    'flex h-14 w-full items-center justify-center border-b border-ig-border px-5 text-center text-sm font-semibold text-ig-text transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-5 backdrop-blur-[1px] animate-[igOverlayFadeIn_120ms_ease-out]"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-ig-border bg-[#26272B] shadow-2xl animate-[igActionSheetIn_160ms_cubic-bezier(0.2,0.8,0.2,1)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Действия с публикацией"
      >
        {canDelete && onDelete && (
          <button
            className={`${rowClass} text-ig-danger`}
            type="button"
            disabled={isRunning}
            onClick={() => void runAction(onDelete)}
          >
            Удалить
          </button>
        )}
        <button
          className={rowClass}
          type="button"
          disabled={isRunning}
          onClick={() => void runAction(onToggleSaved)}
        >
          {post.is_saved ? 'Убрать из сохранённого' : 'Сохранить'}
        </button>
        {onShareToStory && (
          <button
            className={rowClass}
            type="button"
            disabled={isRunning}
            onClick={() => void runAction(onShareToStory)}
          >
            Поделиться в историю
          </button>
        )}
        <button
          className={rowClass}
          type="button"
          disabled={isRunning}
          onClick={goToPost}
        >
          Перейти к публикации
        </button>
        {onOpenViewers && (
          <button
            className={rowClass}
            type="button"
            disabled={isRunning}
            onClick={() => {
              onClose()
              onOpenViewers()
            }}
          >
            Просмотры
          </button>
        )}
        <button
          className={rowClass}
          type="button"
          disabled={isRunning}
          onClick={() => void runAction(() => copyText(window.location.href))}
        >
          Копировать ссылку
        </button>
        <button
          className={rowClass}
          type="button"
          disabled={isRunning}
          onClick={goToAccount}
        >
          Об аккаунте
        </button>
        {error && (
          <p className="border-b border-ig-border px-5 py-3 text-center text-xs text-ig-danger">
            {error}
          </p>
        )}
        <button
          className="flex h-14 w-full items-center justify-center px-5 text-center text-sm text-ig-text transition hover:bg-white/[0.04]"
          type="button"
          disabled={isRunning}
          onClick={onClose}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
