import { create } from 'zustand'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import type { NotificationItem } from '../types/notifications'
import { getApiError } from '../utils/apiError'

interface NotificationsState {
  notifications: NotificationItem[]
  offset: number
  hasNext: boolean
  hasUnread: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  loadNotifications: () => Promise<void>
  loadMore: () => Promise<void>
  markRead: (notificationId: number) => Promise<void>
  markAllRead: () => Promise<void>
  removeNotification: (notificationId: number) => void
  receiveNotification: (notification: NotificationItem) => void
}

const LIMIT = 20

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

function hasUnread(items: NotificationItem[]) {
  return items.some((item) => !item.is_read)
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  offset: 0,
  hasNext: true,
  hasUnread: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  loadNotifications: async () => {
    set({ isLoading: true, error: null })

    try {
      const data = await getNotifications(LIMIT, 0)
      set({
        notifications: data.notifications,
        offset: data.notifications.length,
        hasNext: data.has_next,
        hasUnread: hasUnread(data.notifications),
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { hasNext, isLoading, isLoadingMore, notifications, offset } = get()

    if (!hasNext || isLoading || isLoadingMore) {
      return
    }

    set({ isLoadingMore: true, error: null })

    try {
      const data = await getNotifications(LIMIT, offset)
      const next = [...notifications, ...data.notifications]

      set({
        notifications: next,
        offset: offset + data.notifications.length,
        hasNext: data.has_next,
        hasUnread: hasUnread(next),
      })
    } catch (error) {
      set({ error: getApiError(error) })
    } finally {
      set({ isLoadingMore: false })
    }
  },

  markRead: async (notificationId) => {
    const current = get().notifications

    set({
      notifications: current.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item,
      ),
      hasUnread: hasUnread(
        current.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item,
        ),
      ),
    })

    try {
      await markNotificationRead(notificationId)
    } catch (error) {
      set({ notifications: current, hasUnread: hasUnread(current), error: getApiError(error) })
    }
  },

  markAllRead: async () => {
    const current = get().notifications

    set({
      notifications: current.map((item) => ({ ...item, is_read: true })),
      hasUnread: false,
      error: null,
    })

    try {
      await markAllNotificationsRead()
    } catch (error) {
      set({ notifications: current, hasUnread: hasUnread(current), error: getApiError(error) })
    }
  },

  removeNotification: (notificationId) => {
    set((state) => {
      const next = state.notifications.filter((item) => item.id !== notificationId)

      return {
        notifications: next,
        offset: Math.min(state.offset, next.length),
        hasUnread: hasUnread(next),
      }
    })
  },

  receiveNotification: (notification) => {
    set((state) => {
      const next = sortNotifications([
        notification,
        ...state.notifications.filter((item) => item.id !== notification.id),
      ])

      return {
        notifications: next,
        offset: Math.max(state.offset, next.length),
        hasUnread: true,
      }
    })
  },
}))
