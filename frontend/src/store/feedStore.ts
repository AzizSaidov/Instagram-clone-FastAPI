import { create } from 'zustand'
import {
  getFeedPosts,
  togglePostLike,
  togglePostSaved,
  viewPost,
} from '../api/feed'
import type { Post } from '../types/feed'
import { getApiError } from '../utils/apiError'

interface FeedState {
  posts: Post[]
  offset: number
  hasNext: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  loadFeed: () => Promise<void>
  loadMore: () => Promise<void>
  toggleLike: (postId: number) => Promise<void>
  toggleSaved: (postId: number) => Promise<void>
  markViewed: (postId: number) => Promise<void>
  replacePost: (post: Post) => void
  removePost: (postId: number) => void
}

const FEED_LIMIT = 10

function updatePost(
  posts: Post[],
  postId: number,
  updater: (post: Post) => Post,
) {
  return posts.map((post) => (post.id === postId ? updater(post) : post))
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  offset: 0,
  hasNext: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  loadFeed: async () => {
    set({ isLoading: true, error: null })

    try {
      const data = await getFeedPosts(FEED_LIMIT, 0)
      set({
        posts: data.posts,
        offset: data.posts.length,
        hasNext: data.has_next,
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { hasNext, isLoading, isLoadingMore, offset, posts } = get()

    if (!hasNext || isLoading || isLoadingMore) {
      return
    }

    set({ isLoadingMore: true, error: null })

    try {
      const data = await getFeedPosts(FEED_LIMIT, offset)
      set({
        posts: [...posts, ...data.posts],
        offset: offset + data.posts.length,
        hasNext: data.has_next,
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoadingMore: false })
    }
  },

  toggleLike: async (postId) => {
    const current = get().posts.find((post) => post.id === postId)

    if (!current) {
      return
    }

    set({
      posts: updatePost(get().posts, postId, (post) => ({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.likes_count + (post.is_liked ? -1 : 1),
      })),
    })

    try {
      const data = await togglePostLike(postId)
      set({
        posts: updatePost(get().posts, postId, (post) => ({
          ...post,
          is_liked: data.is_liked,
          likes_count:
            current.likes_count +
            (data.is_liked === current.is_liked ? 0 : data.is_liked ? 1 : -1),
        })),
      })
    } catch (error) {
      set({
        posts: updatePost(get().posts, postId, () => current),
        error: getApiError(error),
      })
    }
  },

  toggleSaved: async (postId) => {
    const current = get().posts.find((post) => post.id === postId)

    if (!current) {
      return
    }

    set({
      posts: updatePost(get().posts, postId, (post) => ({
        ...post,
        is_saved: !post.is_saved,
      })),
    })

    try {
      const data = await togglePostSaved(postId)
      set({
        posts: updatePost(get().posts, postId, (post) => ({
          ...post,
          is_saved: data.is_saved,
        })),
      })
    } catch (error) {
      set({
        posts: updatePost(get().posts, postId, () => current),
        error: getApiError(error),
      })
    }
  },

  markViewed: async (postId) => {
    try {
      await viewPost(postId)
    } catch {
      // View counters should not interrupt reading the feed.
    }
  },

  replacePost: (post) => {
    set((state) => ({
      posts: updatePost(state.posts, post.id, () => post),
    }))
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
      offset: Math.max(0, state.offset - 1),
    }))
  },
}))
