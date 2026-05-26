import { timeAgo } from '../utils/format'

interface TimeAgoProps {
  value: string
  className?: string
}

export function TimeAgo({ value, className = '' }: TimeAgoProps) {
  return (
    <time className={className} dateTime={value}>
      {timeAgo(value)}
    </time>
  )
}
