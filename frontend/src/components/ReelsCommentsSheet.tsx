import { Send, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { Comment, Reel } from '../types/reels'
import { TimeAgo } from './TimeAgo'
import { Avatar } from './Avatar'

interface ReelsCommentsSheetProps {
  reel: Reel
  comments: Comment[]
  isLoading: boolean
  isSending: boolean
  onClose: () => void
  onSend: (text: string) => Promise<void>
}

export function ReelsCommentsSheet({
  reel,
  comments,
  isLoading,
  isSending,
  onClose,
  onSend,
}: ReelsCommentsSheetProps) {
  const [text, setText] = useState('')
  const canSubmit = text.trim().length > 0 && !isSending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    await onSend(text.trim())
    setText('')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 px-3 pb-0 sm:items-center sm:pb-0">
      <section className="flex max-h-[82svh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-2xl border border-ig-border bg-ig-surface shadow-2xl sm:rounded-2xl">
        <header className="flex h-14 items-center justify-between border-b border-ig-border px-4">
          <div>
            <h2 className="text-base font-semibold">Комментарии</h2>
            <p className="text-xs text-ig-muted">@{reel.user.username}</p>
          </div>
          <button
            className="rounded-full p-2 transition hover:bg-ig-elevated"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-[260px] flex-1 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="flex gap-3" key={index}>
                  <div className="h-8 w-8 rounded-full bg-ig-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-ig-elevated" />
                    <div className="h-3 w-44 rounded bg-ig-elevated" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && comments.length === 0 && (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <p className="font-semibold">Комментариев пока нет</p>
              <p className="mt-2 text-sm text-ig-muted">
                Будьте первым, кто оставит комментарий.
              </p>
            </div>
          )}

          {!isLoading && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <article className="flex gap-3" key={comment.id}>
                  <Avatar
                    size={32}
                    src={comment.user.avatar_url}
                    username={comment.user.username}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5">
                      <span className="font-semibold">
                        {comment.user.username}
                      </span>{' '}
                      {comment.text}
                    </p>
                    <TimeAgo
                      className="mt-1 block text-xs text-ig-faint"
                      value={comment.created_at}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <form
          className="flex items-center gap-3 border-t border-ig-border px-4 py-3"
          onSubmit={handleSubmit}
        >
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-ig-text outline-none placeholder:text-ig-faint"
            maxLength={500}
            placeholder="Добавить комментарий..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button
            className="rounded-full p-2 text-ig-primary transition hover:bg-ig-elevated disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!canSubmit}
            aria-label="Отправить"
          >
            <Send size={19} />
          </button>
        </form>
      </section>
    </div>
  )
}
