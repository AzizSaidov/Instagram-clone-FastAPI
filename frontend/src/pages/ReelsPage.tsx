import { useCallback, useEffect, useState } from 'react'
import { getCommentLikeUsers, getReelLikeUsers } from '../api/likes'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useReelsStore } from '../store/reelsStore'
import type { Comment, Reel } from '../types/reels'
import { ReelCard } from '../components/ReelCard'
import { ReelsCommentsSheet } from '../components/ReelsCommentsSheet'
import { ViewersModal } from '../components/ViewersModal'

function ReelsSkeleton() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-6">
      <div className="flex h-[min(760px,calc(100svh-48px))] w-full max-w-[520px] items-end gap-4">
        <div className="h-full flex-1 rounded-lg bg-ig-elevated" />
        <div className="flex w-16 flex-col items-center gap-5 pb-2">
          <div className="h-11 w-11 rounded-full bg-ig-elevated" />
          <div className="h-10 w-10 rounded-full bg-ig-elevated" />
          <div className="h-10 w-10 rounded-full bg-ig-elevated" />
        </div>
      </div>
    </div>
  )
}

function EmptyReels() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold">Reels пока нет</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ig-muted">
        Здесь появятся ваши ролики и Reels от пользователей, на которых вы
        подписаны.
      </p>
    </div>
  )
}

export function ReelsPage() {
  const [activeCommentsReel, setActiveCommentsReel] = useState<Reel | null>(
    null,
  )
  const [likesModal, setLikesModal] = useState<
    { kind: 'reel' | 'comment'; id: number; title: string } | null
  >(null)
  const reels = useReelsStore((state) => state.reels)
  const isLoading = useReelsStore((state) => state.isLoading)
  const isLoadingMore = useReelsStore((state) => state.isLoadingMore)
  const hasNext = useReelsStore((state) => state.hasNext)
  const error = useReelsStore((state) => state.error)
  const followedUsernames = useReelsStore((state) => state.followedUsernames)
  const commentsByReelId = useReelsStore((state) => state.commentsByReelId)
  const loadReels = useReelsStore((state) => state.loadReels)
  const loadMore = useReelsStore((state) => state.loadMore)
  const toggleLike = useReelsStore((state) => state.toggleLike)
  const toggleSaved = useReelsStore((state) => state.toggleSaved)
  const markViewed = useReelsStore((state) => state.markViewed)
  const follow = useReelsStore((state) => state.follow)
  const loadComments = useReelsStore((state) => state.loadComments)
  const toggleCommentLike = useReelsStore((state) => state.toggleCommentLike)
  const sendComment = useReelsStore((state) => state.sendComment)

  useEffect(() => {
    void loadReels()
  }, [loadReels])

  const handleLoadMore = useCallback(() => {
    void loadMore()
  }, [loadMore])

  const sentinelRef = useInfiniteScroll({
    disabled: !hasNext || isLoading || isLoadingMore,
    onLoadMore: handleLoadMore,
  })

  function openComments(reel: Reel) {
    setActiveCommentsReel(reel)
    void loadComments(reel.id)
  }

  const commentsState = activeCommentsReel
    ? commentsByReelId[activeCommentsReel.id]
    : undefined

  return (
    <main className="h-svh overflow-y-auto overscroll-contain bg-ig-bg text-ig-text [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="snap-y snap-mandatory">
        {error && (
          <div className="mx-auto mt-5 max-w-[520px] rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-4 py-3 text-sm text-ig-text">
            {error}
          </div>
        )}

        {isLoading && <ReelsSkeleton />}
        {!isLoading && reels.length === 0 && <EmptyReels />}

        {reels.map((reel) => (
          <ReelCard
            isFollowed={followedUsernames.has(reel.user.username)}
            key={reel.id}
            reel={reel}
            onComment={openComments}
            onFollow={(username) => void follow(username)}
            onLike={(reelsId) => void toggleLike(reelsId)}
            onOpenLikes={(reel) =>
              setLikesModal({
                kind: 'reel',
                id: reel.id,
                title: 'Лайки Reel',
              })
            }
            onSave={(reelsId) => void toggleSaved(reelsId)}
            onViewed={(reelsId, watchedPercent) =>
              void markViewed(reelsId, watchedPercent)
            }
          />
        ))}

        {isLoadingMore && <ReelsSkeleton />}
        <div ref={sentinelRef} />
      </div>

      {activeCommentsReel && (
        <ReelsCommentsSheet
          comments={commentsState?.items ?? []}
          isLoading={commentsState?.isLoading ?? false}
          isSending={commentsState?.isSending ?? false}
          reel={activeCommentsReel}
          onClose={() => setActiveCommentsReel(null)}
          onLikeComment={(comment: Comment) =>
            toggleCommentLike(activeCommentsReel.id, comment.id)
          }
          onOpenCommentLikes={(comment: Comment) =>
            setLikesModal({
              kind: 'comment',
              id: comment.id,
              title: 'Лайки комментария',
            })
          }
          onSend={(text) => sendComment(activeCommentsReel.id, text)}
        />
      )}
      {likesModal && (
        <ViewersModal
          title={likesModal.title}
          viewerKey={`${likesModal.kind}-${likesModal.id}`}
          loadViewers={() =>
            likesModal.kind === 'reel'
              ? getReelLikeUsers(likesModal.id)
              : getCommentLikeUsers(likesModal.id)
          }
          onClose={() => setLikesModal(null)}
        />
      )}
    </main>
  )
}
