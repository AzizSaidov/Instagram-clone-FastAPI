export type NotificationType = 'like' | 'comment' | 'follow' | 'follow_request'

export interface NotificationUser {
  id: number
  username: string
  avatar_url: string | null
  is_following: boolean
  is_follow_requested: boolean
}

export interface NotificationItem {
  id: number
  type: NotificationType
  post_id: number | null
  reels_id: number | null
  comment_id: number | null
  is_read: boolean
  created_at: string
  from_user: NotificationUser
}

export interface NotificationResponse {
  notification: NotificationItem
}

export interface NotificationsListResponse {
  notifications: NotificationItem[]
  limit: number
  offset: number
  has_next: boolean
}
