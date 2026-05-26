import type { Post } from '../types/feed'

interface PostCaptionProps {
  post: Post
  onUsernameClick?: (username: string) => void
  className?: string
  showUsername?: boolean
}

function normalizeHashtags(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith('#') ? item : `#${item}`))
}

export function PostCaption({
  post,
  onUsernameClick,
  className = '',
  showUsername = true,
}: PostCaptionProps) {
  const hashtags = normalizeHashtags(post.hashtag)
  const hasDescription = Boolean(post.description?.trim())

  if (!hasDescription && hashtags.length === 0) {
    return null
  }

  return (
    <div className={`min-w-0 text-sm leading-5 ${className}`}>
      <p>
        {showUsername && (
          <>
            {onUsernameClick ? (
              <button
                className="font-semibold"
                type="button"
                onClick={() => onUsernameClick(post.user.username)}
              >
                {post.user.username}
              </button>
            ) : (
              <span className="font-semibold">{post.user.username}</span>
            )}
          </>
        )}
        {hasDescription && (
          <span className="whitespace-pre-line">
            {showUsername ? ' ' : ''}
            {post.description}
          </span>
        )}
      </p>
      {hashtags.length > 0 && (
        <div className={hasDescription ? 'mt-2 space-y-0.5' : 'mt-0.5 space-y-0.5'}>
          {hashtags.map((hashtag, index) => (
            <span className="block text-ig-primary" key={`${hashtag}-${index}`}>
              {hashtag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
