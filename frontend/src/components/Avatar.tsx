import { mediaUrl } from '../utils/media'

interface AvatarProps {
  src?: string | null
  size?: 32 | 44 | 56 | 150
  hasStory?: boolean
  storyViewed?: boolean
  username?: string | null
}

const sizeClass = {
  32: 'h-8 w-8 text-xs',
  44: 'h-11 w-11 text-sm',
  56: 'h-14 w-14 text-base',
  150: 'h-[150px] w-[150px] text-4xl',
}

export function Avatar({
  src,
  size = 32,
  hasStory = false,
  storyViewed = false,
  username = '',
}: AvatarProps) {
  const resolvedSrc = mediaUrl(src)
  const initial = username?.trim().charAt(0).toUpperCase() || 'I'
  const avatar = (
    <div
      className={`${sizeClass[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ig-elevated font-semibold text-ig-text`}
    >
      {resolvedSrc ? (
        <img
          className="h-full w-full object-cover"
          src={resolvedSrc}
          alt={username ? `${username} avatar` : 'avatar'}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )

  if (!hasStory) {
    return avatar
  }

  return (
    <div
      className={`rounded-full p-[2px] ${
        storyViewed
          ? 'bg-ig-border'
          : 'bg-[linear-gradient(45deg,#F58529,#DD2A7B,#8134AF,#515BD4)]'
      }`}
    >
      <div className="rounded-full bg-ig-bg p-[2px]">{avatar}</div>
    </div>
  )
}
