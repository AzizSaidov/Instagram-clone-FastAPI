import { create } from 'zustand'
import {
  addReelComment,
  followUser,
  getReelComments,
  getReelsFeed,
  toggleReelLike,
  updateReelView,
} from '../api/reels'
import type { Comment, Reel } from '../types/reels'
import { getApiError } from '../utils/apiError'

interface CommentsState {
  items: Comment[]
  offset: number
  hasNext: boolean
  isLoading: boolean
  isSending: boolean
}

interface ReelsState {
  reels: Reel[]
  offset: number
  hasNext: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  followedUsernames: Set<string>
  commentsByReelId: Record<number, CommentsState>
  loadReels: () => Promise<void>
  loadMore: () => Promise<void>
  toggleLike: (reelsId: number) => Promise<void>
  markViewed: (reelsId: number, watchedPercent: number) => Promise<void>
  follow: (username: string) => Promise<void>
  loadComments: (reelsId: number) => Promise<void>
  sendComment: (reelsId: number, text: string) => Promise<void>
}

const REELS_LIMIT = 6

const initialCommentsState: CommentsState = {
  items: [],
  offset: 0,
  hasNext: true,
  isLoading: false,
  isSending: false,
}

function updateReel(
  reels: Reel[],
  reelsId: number,
  updater: (reel: Reel) => Reel,
) {
  return reels.map((reel) => (reel.id === reelsId ? updater(reel) : reel))
}

export const useReelsStore = create<ReelsState>((set, get) => ({
  reels: [],
  offset: 0,
  hasNext: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  followedUsernames: new Set(),
  commentsByReelId: {},

  loadReels: async () => {
    set({ isLoading: true, error: null })

    try {
      const data = await getReelsFeed(REELS_LIMIT, 0)
      set({
        reels: data.reels,
        offset: data.reels.length,
        hasNext: data.has_next,
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { hasNext, isLoading, isLoadingMore, offset, reels } = get()

    if (!hasNext || isLoading || isLoadingMore) {
      return
    }

    set({ isLoadingMore: true, error: null })

    try {
      const data = await getReelsFeed(REELS_LIMIT, offset)
      set({
        reels: [...reels, ...data.reels],
        offset: offset + data.reels.length,
        hasNext: data.has_next,
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoadingMore: false })
    }
  },

  toggleLike: async (reelsId) => {
    const current = get().reels.find((reel) => reel.id === reelsId)

    if (!current) {
      return
    }

    set({
      reels: updateReel(get().reels, reelsId, (reel) => ({
        ...reel,
        is_liked: !reel.is_liked,
        likes_count: reel.likes_count + (reel.is_liked ? -1 : 1),
      })),
    })

    try {
      const data = await toggleReelLike(reelsId)
      set({
        reels: updateReel(get().reels, reelsId, (reel) => ({
          ...reel,
          is_liked: data.is_liked,
          likes_count:
            current.likes_count +
            (data.is_liked === current.is_liked ? 0 : data.is_liked ? 1 : -1),
        })),
      })
    } catch (error) {
      set({
        reels: updateReel(get().reels, reelsId, () => current),
        error: getApiError(error),
      })
    }
  },

  markViewed: async (reelsId, watchedPercent) => {
    try {
      const { reel } = await updateReelView(reelsId, watchedPercent)
      set({
        reels: updateReel(get().reels, reelsId, () => reel),
      })
    } catch {
      // View progress is best-effort and should not interrupt playback.
    }
  },

  follow: async (username) => {
    try {
      await followUser(username)
      set((state) => ({
        followedUsernames: new Set(state.followedUsernames).add(username),
      }))
    } catch (error) {
      set({ error: getApiError(error) })
    }
  },

  loadComments: async (reelsId) => {
    const current = get().commentsByReelId[reelsId] ?? initialCommentsState

    set((state) => ({
      commentsByReelId: {
        ...state.commentsByReelId,
        [reelsId]: { ...current, isLoading: true },
      },
    }))

    try {
      const data = await getReelComments(reelsId)
      set((state) => ({
        commentsByReelId: {
          ...state.commentsByReelId,
          [reelsId]: {
            items: data.comments,
            offset: data.comments.length,
            hasNext: data.has_next,
            isLoading: false,
            isSending: false,
          },
        },
      }))
    } catch (error) {
      set({ error: getApiError(error) })
      set((state) => ({
        commentsByReelId: {
          ...state.commentsByReelId,
          [reelsId]: { ...current, isLoading: false },
        },
      }))
    }
  },

  sendComment: async (reelsId, text) => {
    const current = get().commentsByReelId[reelsId] ?? initialCommentsState

    set((state) => ({
      commentsByReelId: {
        ...state.commentsByReelId,
        [reelsId]: { ...current, isSending: true },
      },
    }))

    try {
      const { comment } = await addReelComment(reelsId, text)

      set((state) => {
        const latest = state.commentsByReelId[reelsId] ?? initialCommentsState

        return {
          reels: updateReel(state.reels, reelsId, (reel) => ({
            ...reel,
            comments_count: reel.comments_count + 1,
          })),
          commentsByReelId: {
            ...state.commentsByReelId,
            [reelsId]: {
              ...latest,
              items: [comment, ...latest.items],
              offset: latest.offset + 1,
              isSending: false,
            },
          },
        }
      })
    } catch (error) {
      set({ error: getApiError(error) })
      set((state) => ({
        commentsByReelId: {
          ...state.commentsByReelId,
          [reelsId]: { ...current, isSending: false },
        },
      }))
    }
  },
}))
