import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePost, deleteStory, getPost, getPostViewers } from '../api/feed'
import { followProfile, getProfileRecommendations } from '../api/profiles'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useFeedStore } from '../store/feedStore'
import { useStoriesStore, type StoryGroup } from '../store/storiesStore'
import { useAuthStore } from '../store/authStore'
import { Avatar } from '../components/Avatar'
import { PostDetailModal } from '../components/PostDetailModal'
import { PostCard } from '../components/PostCard'
import { PostSkeleton } from '../components/PostSkeleton'
import { StoryRow } from '../components/StoryRow'
import { StoryViewer } from '../components/StoryViewer'
import { ViewersModal } from '../components/ViewersModal'
import type { Post } from '../types/feed'
import type { ProfileSearchUser } from '../types/profiles'

function RightRail() {
  const user = useAuthStore((state) => state.user)
  const [recommendations, setRecommendations] = useState<ProfileSearchUser[]>([])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const data = await getProfileRecommendations(5, 0)
        setRecommendations(data.users)
      } catch {
        setRecommendations([])
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  async function handleFollow(username: string) {
    try {
      await followProfile(username)
      setRecommendations((items) =>
        items.filter((profile) => profile.username !== username),
      )
    } catch {
      // Recommendations are optional and should not interrupt the feed.
    }
  }

  return (
    <aside className="sticky top-8 hidden h-fit w-[330px] pt-7 xl:block">
      <div className="flex items-center gap-3">
        <Avatar
          size={44}
          src={user?.profile.avatar_url}
          username={user?.profile.username}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {user?.profile.username ?? 'instagram'}
          </p>
          <p className="truncate text-sm text-ig-muted">
            {user?.profile.full_name ?? 'Instagram Clone'}
          </p>
        </div>
      </div>
      {recommendations.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ig-muted">
              Рекомендации для вас
            </h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((profile) => (
              <article className="flex items-center gap-3" key={profile.id}>
                <Link
                  className="shrink-0"
                  to={`/profile/${profile.username}`}
                >
                  <Avatar
                    size={44}
                    src={profile.avatar_url}
                    username={profile.username}
                  />
                </Link>
                <Link
                  className="min-w-0 flex-1"
                  to={`/profile/${profile.username}`}
                >
                  <p className="truncate text-sm font-semibold">
                    {profile.username}
                  </p>
                  <p className="truncate text-xs text-ig-muted">
                    {profile.full_name ?? 'Рекомендовано для вас'}
                  </p>
                </Link>
                <button
                  className="text-xs font-semibold text-ig-primary transition hover:text-ig-text"
                  type="button"
                  onClick={() => void handleFollow(profile.username)}
                >
                  Подписаться
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}

function EmptyFeed() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Публикаций пока нет</h1>
      <p className="mt-2 text-sm text-ig-muted">
        Здесь появятся ваши публикации и посты подписок.
      </p>
    </div>
  )
}

export function HomePage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [viewersPost, setViewersPost] = useState<Post | null>(null)
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null)
  const posts = useFeedStore((state) => state.posts)
  const isLoading = useFeedStore((state) => state.isLoading)
  const isLoadingMore = useFeedStore((state) => state.isLoadingMore)
  const hasNext = useFeedStore((state) => state.hasNext)
  const error = useFeedStore((state) => state.error)
  const loadFeed = useFeedStore((state) => state.loadFeed)
  const loadMore = useFeedStore((state) => state.loadMore)
  const toggleLike = useFeedStore((state) => state.toggleLike)
  const toggleSaved = useFeedStore((state) => state.toggleSaved)
  const markViewed = useFeedStore((state) => state.markViewed)
  const replacePost = useFeedStore((state) => state.replacePost)
  const removePost = useFeedStore((state) => state.removePost)
  const storyGroups = useStoriesStore((state) => state.groups)
  const storiesLoading = useStoriesStore((state) => state.isLoading)
  const loadStories = useStoriesStore((state) => state.loadStories)
  const markStoryViewed = useStoriesStore((state) => state.markStoryViewed)
  const removeStory = useStoriesStore((state) => state.removeStory)

  useEffect(() => {
    void loadFeed()
    void loadStories()
  }, [loadFeed, loadStories])

  const handleLoadMore = useCallback(() => {
    void loadMore()
  }, [loadMore])

  const sentinelRef = useInfiniteScroll({
    disabled: !hasNext || isLoading || isLoadingMore,
    onLoadMore: handleLoadMore,
  })

  function handleStoryClick(group: StoryGroup) {
    const index = storyGroups.findIndex((item) => item.userId === group.userId)

    if (index >= 0) {
      setStoryViewerIndex(index)
    }
  }

  async function handleDeleteStory(storyId: number) {
    await deleteStory(storyId)
    removeStory(storyId)
  }

  async function handleOpenPost(post: Post) {
    setSelectedPost(post)
    void markViewed(post.id)

    try {
      const data = await getPost(post.id)
      replacePost(data.post)
      setSelectedPost(data.post)
    } catch {
      // The existing feed item is enough to open the modal.
    }
  }

  async function handleModalLike(postId: number) {
    await toggleLike(postId)

    try {
      const data = await getPost(postId)
      replacePost(data.post)
      setSelectedPost(data.post)
    } catch {
      setSelectedPost((post) =>
        post?.id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.likes_count + (post.is_liked ? -1 : 1),
            }
          : post,
      )
    }
  }

  async function handleModalSave(postId: number) {
    await toggleSaved(postId)

    try {
      const data = await getPost(postId)
      replacePost(data.post)
      setSelectedPost(data.post)
    } catch {
      setSelectedPost((post) =>
        post?.id === postId ? { ...post, is_saved: !post.is_saved } : post,
      )
    }
  }

  async function handleDeletePost(postId: number) {
    await deletePost(postId)
    removePost(postId)
    setSelectedPost((post) => (post?.id === postId ? null : post))
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh+120px)] w-full max-w-[1000px] gap-14 px-4 pb-28 pt-5 sm:px-8">
      <section className="mx-auto w-full max-w-[560px]">
        <StoryRow
          groups={storyGroups}
          isLoading={storiesLoading}
          onStoryClick={handleStoryClick}
        />
        {error && (
          <div className="mt-6 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-4 py-3 text-sm text-ig-text">
            {error}
          </div>
        )}
        <div className="space-y-6 pt-2">
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          {!isLoading && posts.length === 0 && <EmptyFeed />}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={(postId) => void toggleLike(postId)}
              onOpen={(post) => void handleOpenPost(post)}
              onOpenViewers={setViewersPost}
              onSave={(postId) => void toggleSaved(postId)}
              onViewed={(postId) => void markViewed(postId)}
              onDelete={handleDeletePost}
            />
          ))}
          {isLoadingMore && <PostSkeleton />}
          <div ref={sentinelRef} />
        </div>
      </section>
      <RightRail />
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={(postId) => void handleModalLike(postId)}
          onPostChange={(post) => {
            replacePost(post)
            setSelectedPost(post)
          }}
          onSave={(postId) => void handleModalSave(postId)}
          onDelete={handleDeletePost}
        />
      )}
      {viewersPost && (
        <ViewersModal
          title="Просмотры"
          loadViewers={() => getPostViewers(viewersPost.id)}
          onClose={() => setViewersPost(null)}
        />
      )}
      {storyViewerIndex !== null && storyGroups[storyViewerIndex] && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={storyViewerIndex}
          onClose={() => setStoryViewerIndex(null)}
          onDelete={handleDeleteStory}
          onViewed={(storyId) => markStoryViewed(storyId)}
        />
      )}
    </main>
  )
}
