import { Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { type StoryGroup } from '../store/storiesStore'
import { Avatar } from './Avatar'

interface StoryRowProps {
  groups: StoryGroup[]
  isLoading: boolean
  onStoryClick: (group: StoryGroup) => void
}

function StorySkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-1 py-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div className="flex w-[74px] shrink-0 flex-col items-center gap-2" key={index}>
          <div className="h-16 w-16 rounded-full bg-ig-elevated" />
          <div className="h-3 w-14 rounded bg-ig-elevated" />
        </div>
      ))}
    </div>
  )
}

export function StoryRow({
  groups,
  isLoading,
  onStoryClick,
}: StoryRowProps) {
  const user = useAuthStore((state) => state.user)
  const myUsername = user?.profile.username
  const myStoryGroup = groups.find((group) => group.username === myUsername)
  const visibleGroups = groups.filter((group) => group.username !== myUsername)
  const isMyStoryViewed = Boolean(
    myStoryGroup?.stories.every((story) => story.is_viewed),
  )

  if (isLoading) {
    return <StorySkeleton />
  }

  return (
    <section className="border-b border-ig-border px-1 pb-4">
      <div className="flex gap-4 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          className="relative flex w-[88px] shrink-0 flex-col items-center gap-2 text-center disabled:cursor-default"
          type="button"
          disabled={!myStoryGroup}
          onClick={() => {
            if (myStoryGroup) {
              onStoryClick(myStoryGroup)
            }
          }}
        >
          <div className="relative">
            <Avatar
              hasStory={Boolean(myStoryGroup)}
              storyViewed={isMyStoryViewed}
              size={56}
              src={user?.profile.avatar_url}
              username={user?.profile.username}
            />
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ig-bg bg-ig-primary">
              <Plus size={12} strokeWidth={3} />
            </span>
          </div>
          <span className="max-w-[88px] text-xs text-ig-text">
            Ваша история
          </span>
        </button>
        {visibleGroups.map((group) => (
          <button
            className="flex w-[76px] shrink-0 flex-col items-center gap-2 text-center"
            key={group.userId}
            type="button"
            onClick={() => onStoryClick(group)}
          >
            <Avatar
              hasStory
              storyViewed={group.stories.every((story) => story.is_viewed)}
              size={56}
              src={group.avatarUrl}
              username={group.username}
            />
            <span className="max-w-[72px] truncate text-xs text-ig-text">
              {group.username}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
