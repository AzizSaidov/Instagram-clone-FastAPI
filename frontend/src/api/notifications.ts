import api from './client'
import type {
  NotificationResponse,
  NotificationsListResponse,
} from '../types/notifications'

export async function getNotifications(limit = 20, offset = 0) {
  const { data } = await api.get<NotificationsListResponse>('/notifications/', {
    params: { limit, offset },
  })
  return data
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await api.put<NotificationResponse>(
    `/notifications/${notificationId}/read/`,
  )
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await api.put('/notifications/read-all/')
  return data
}

export async function acceptFollowRequest(username: string) {
  const { data } = await api.post(`/follows/requests/${username}/accept/`)
  return data
}

export async function rejectFollowRequest(username: string) {
  const { data } = await api.delete(`/follows/requests/${username}/reject/`)
  return data
}
