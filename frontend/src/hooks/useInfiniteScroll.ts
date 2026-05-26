import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  disabled?: boolean
  onLoadMore: () => void
}

export function useInfiniteScroll({
  disabled = false,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || disabled) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '280px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [disabled, onLoadMore])

  return sentinelRef
}
