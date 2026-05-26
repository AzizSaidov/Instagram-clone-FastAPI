import axios from 'axios'
import { create } from 'zustand'
import { getMyNote, getNotes, getStoriesFeed, viewStory } from '../api/feed'
import type { Note, Story } from '../types/feed'
import { getApiError } from '../utils/apiError'

export interface StoryGroup {
  userId: number
  username: string
  avatarUrl: string | null
  stories: Story[]
  note: Note | null
}

interface StoriesState {
  groups: StoryGroup[]
  myNote: Note | null
  notesByUsername: Record<string, Note>
  isLoading: boolean
  error: string | null
  loadStories: () => Promise<void>
  markStoryViewed: (storyId: number) => Promise<void>
  removeStory: (storyId: number) => void
}

function groupStories(stories: Story[], notesByUsername: Record<string, Note>) {
  const groupsByUser = new Map<number, StoryGroup>()

  stories.forEach((story) => {
    const existing = groupsByUser.get(story.user_id)

    if (existing) {
      existing.stories.push(story)
      return
    }

    groupsByUser.set(story.user_id, {
      userId: story.user_id,
      username: story.user.username,
      avatarUrl: story.user.avatar_url,
      stories: [story],
      note: notesByUsername[story.user.username] ?? null,
    })
  })

  return Array.from(groupsByUser.values())
}

export const useStoriesStore = create<StoriesState>((set) => ({
  groups: [],
  myNote: null,
  notesByUsername: {},
  isLoading: false,
  error: null,

  loadStories: async () => {
    set({ isLoading: true, error: null })

    try {
      const [storiesData, notesData, myNoteData] = await Promise.all([
        getStoriesFeed(),
        getNotes(),
        getMyNote().catch((error) => {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null
          }

          throw error
        }),
      ])

      const notesByUsername = notesData.notes.reduce<Record<string, Note>>(
        (acc, note) => {
          acc[note.user.username] = note
          return acc
        },
        {},
      )

      set({
        groups: groupStories(storiesData.stories, notesByUsername),
        notesByUsername,
        myNote: myNoteData?.note ?? null,
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  markStoryViewed: async (storyId) => {
    try {
      const data = await viewStory(storyId)
      set((state) => ({
        groups: state.groups.map((group) => ({
          ...group,
          stories: group.stories.map((story) =>
            story.id === storyId ? data.story : story,
          ),
        })),
      }))
    } catch {
      // Story view updates are best-effort for the feed strip.
    }
  },

  removeStory: (storyId) => {
    set((state) => ({
      groups: state.groups
        .map((group) => ({
          ...group,
          stories: group.stories.filter((story) => story.id !== storyId),
        }))
        .filter((group) => group.stories.length > 0),
    }))
  },
}))
