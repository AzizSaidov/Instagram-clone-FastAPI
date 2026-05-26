import { create } from 'zustand'
import {
  acceptFollowRequest,
  addGroupMember,
  createChat,
  createGroup as createGroupRequest,
  getChatMessages,
  getChats,
  getFollowRequests,
  getGroupMessages,
  getGroups,
  markChatRead,
  markGroupRead,
  rejectFollowRequest,
  searchProfiles,
  sendChatMessage,
  sendGroupMessage,
} from '../api/messages'
import type {
  ActiveConversation,
  Chat,
  DirectMessage,
  FollowRequestUser,
  Group,
} from '../types/messages'
import { getApiError } from '../utils/apiError'

interface MessageListState {
  items: DirectMessage[]
  isLoading: boolean
  hasNext: boolean
  offset: number
}

interface MessagesState {
  chats: Chat[]
  groups: Group[]
  followRequests: FollowRequestUser[]
  active: ActiveConversation | null
  messagesByKey: Record<string, MessageListState>
  searchResults: FollowRequestUser[]
  isLoadingLists: boolean
  isLoadingRequests: boolean
  isSearching: boolean
  isSending: boolean
  error: string | null
  loadLists: () => Promise<void>
  loadFollowRequests: () => Promise<void>
  acceptRequest: (username: string) => Promise<void>
  rejectRequest: (username: string) => Promise<void>
  searchUsers: (query: string) => Promise<void>
  startChat: (username: string) => Promise<Chat | null>
  createGroup: (
    payload: { name: string; avatarUrl?: string | null; memberUsernames?: string[] },
  ) => Promise<Group | null>
  upsertGroup: (group: Group) => void
  removeGroup: (groupId: number) => void
  setActive: (active: ActiveConversation | null) => Promise<void>
  loadMessages: (active: ActiveConversation) => Promise<void>
  sendMessage: (
    active: ActiveConversation,
    payload: { text?: string; file?: File | null },
  ) => Promise<void>
  receiveDirectMessage: (chatId: number, message: DirectMessage) => void
  receiveGroupMessage: (groupId: number, message: DirectMessage) => void
}

const PAGE_LIMIT = 30

function keyFor(active: ActiveConversation) {
  return `${active.kind}:${active.id}`
}

function emptyMessages(): MessageListState {
  return { items: [], isLoading: false, hasNext: true, offset: 0 }
}

function sortByUpdatedAt<T extends { updated_at: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}

function upsertMessage(items: DirectMessage[], message: DirectMessage) {
  if (items.some((item) => item.id === message.id)) {
    return items
  }

  return [...items, message]
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  chats: [],
  groups: [],
  followRequests: [],
  active: null,
  messagesByKey: {},
  searchResults: [],
  isLoadingLists: false,
  isLoadingRequests: false,
  isSearching: false,
  isSending: false,
  error: null,

  loadLists: async () => {
    set({ isLoadingLists: true, error: null })

    try {
      const [chatsData, groupsData] = await Promise.all([getChats(), getGroups()])
      set({
        chats: chatsData.chats,
        groups: groupsData.groups,
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoadingLists: false })
    }
  },

  loadFollowRequests: async () => {
    set({ isLoadingRequests: true, error: null })

    try {
      const data = await getFollowRequests()
      set({ followRequests: data.users })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoadingRequests: false })
    }
  },

  acceptRequest: async (username) => {
    try {
      await acceptFollowRequest(username)
      set((state) => ({
        followRequests: state.followRequests.filter(
          (user) => user.username !== username,
        ),
      }))
    } catch (error) {
      set({ error: getApiError(error) })
    }
  },

  rejectRequest: async (username) => {
    try {
      await rejectFollowRequest(username)
      set((state) => ({
        followRequests: state.followRequests.filter(
          (user) => user.username !== username,
        ),
      }))
    } catch (error) {
      set({ error: getApiError(error) })
    }
  },

  searchUsers: async (query) => {
    const trimmed = query.trim()

    if (trimmed.length < 1) {
      set({ searchResults: [], isSearching: false })
      return
    }

    set({ isSearching: true, error: null })

    try {
      const data = await searchProfiles(trimmed)
      set({ searchResults: data.users })
    } catch (error) {
      set({ error: getApiError(error), searchResults: [] })
    } finally {
      set({ isSearching: false })
    }
  },

  startChat: async (username) => {
    try {
      const { chat } = await createChat(username)
      set((state) => ({
        chats: sortByUpdatedAt([
          chat,
          ...state.chats.filter((item) => item.id !== chat.id),
        ]),
        active: { kind: 'chat', id: chat.id },
      }))
      await get().loadMessages({ kind: 'chat', id: chat.id })
      return chat
    } catch (error) {
      set({ error: getApiError(error) })
      return null
    }
  },

  createGroup: async ({ name, avatarUrl = null, memberUsernames = [] }) => {
    try {
      const { group } = await createGroupRequest({
        name,
        avatar_url: avatarUrl,
      })
      let nextGroup = group

      for (const username of memberUsernames) {
        const response = await addGroupMember(nextGroup.id, username)
        nextGroup = response.group
      }

      set((state) => ({
        groups: sortByUpdatedAt([
          nextGroup,
          ...state.groups.filter((item) => item.id !== nextGroup.id),
        ]),
        active: { kind: 'group', id: nextGroup.id },
      }))
      await get().loadMessages({ kind: 'group', id: nextGroup.id })

      return nextGroup
    } catch (error) {
      set({ error: getApiError(error) })
      return null
    }
  },

  upsertGroup: (group) => {
    set((state) => ({
      groups: sortByUpdatedAt([
        group,
        ...state.groups.filter((item) => item.id !== group.id),
      ]),
    }))
  },

  removeGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
      active:
        state.active?.kind === 'group' && state.active.id === groupId
          ? null
          : state.active,
    }))
  },

  setActive: async (active) => {
    set({ active })

    if (active) {
      await get().loadMessages(active)
    }
  },

  loadMessages: async (active) => {
    const key = keyFor(active)
    const current = get().messagesByKey[key] ?? emptyMessages()

    set((state) => ({
      messagesByKey: {
        ...state.messagesByKey,
        [key]: { ...current, isLoading: true },
      },
    }))

    try {
      const data =
        active.kind === 'chat'
          ? await getChatMessages(active.id, PAGE_LIMIT, 0)
          : await getGroupMessages(active.id, PAGE_LIMIT, 0)
      const items = [...data.messages].reverse()

      if (active.kind === 'chat') {
        void markChatRead(active.id)
      } else {
        void markGroupRead(active.id)
      }

      set((state) => ({
        messagesByKey: {
          ...state.messagesByKey,
          [key]: {
            items,
            isLoading: false,
            hasNext: data.has_next,
            offset: data.messages.length,
          },
        },
      }))
    } catch (error) {
      set({ error: getApiError(error) })
      set((state) => ({
        messagesByKey: {
          ...state.messagesByKey,
          [key]: { ...current, isLoading: false },
        },
      }))
    }
  },

  sendMessage: async (active, payload) => {
    set({ isSending: true, error: null })

    try {
      const response =
        active.kind === 'chat'
          ? await sendChatMessage(active.id, payload)
          : await sendGroupMessage(active.id, payload)
      const message = response.message
      const key = keyFor(active)

      set((state) => {
        const current = state.messagesByKey[key] ?? emptyMessages()

        if (active.kind === 'chat') {
          return {
            messagesByKey: {
              ...state.messagesByKey,
              [key]: { ...current, items: upsertMessage(current.items, message) },
            },
            chats: sortByUpdatedAt(
              state.chats.map((chat) =>
                chat.id === active.id
                  ? {
                      ...chat,
                      updated_at: message.created_at,
                      last_message: message,
                    }
                  : chat,
              ),
            ),
          }
        }

        return {
          messagesByKey: {
            ...state.messagesByKey,
            [key]: { ...current, items: upsertMessage(current.items, message) },
          },
          groups: sortByUpdatedAt(
            state.groups.map((group) =>
              group.id === active.id
                ? {
                    ...group,
                    updated_at: message.created_at,
                    last_message: message,
                  }
                : group,
            ),
          ),
        }
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isSending: false })
    }
  },

  receiveDirectMessage: (chatId, message) => {
    const key = keyFor({ kind: 'chat', id: chatId })

    set((state) => {
      const current = state.messagesByKey[key] ?? emptyMessages()

      return {
        messagesByKey: {
          ...state.messagesByKey,
          [key]: { ...current, items: upsertMessage(current.items, message) },
        },
        chats: sortByUpdatedAt(
          state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, updated_at: message.created_at, last_message: message }
              : chat,
          ),
        ),
      }
    })
  },

  receiveGroupMessage: (groupId, message) => {
    const key = keyFor({ kind: 'group', id: groupId })

    set((state) => {
      const current = state.messagesByKey[key] ?? emptyMessages()

      return {
        messagesByKey: {
          ...state.messagesByKey,
          [key]: { ...current, items: upsertMessage(current.items, message) },
        },
        groups: sortByUpdatedAt(
          state.groups.map((group) =>
            group.id === groupId
              ? { ...group, updated_at: message.created_at, last_message: message }
              : group,
          ),
        ),
      }
    })
  },
}))
