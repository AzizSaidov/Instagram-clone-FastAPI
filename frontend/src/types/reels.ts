import type { PostUser, ToggleLikeResponse } from './feed'

export interface Reel {
  id: number
  user_id: number
  video_url: string
  description: string | null
  hashtag: string | null
  views_count: number
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at: string
  user: PostUser
}

export interface ReelsListResponse {
  reels: Reel[]
  limit: number
  offset: number
  has_next: boolean
}

export interface ReelResponse {
  reel: Reel
}

export interface ReelViewPayload {
  watched_percent: number
}

export interface Comment {
  id: number
  post_id: number | null
  reels_id: number | null
  text: string
  created_at: string
  user: PostUser
}

export interface CommentsListResponse {
  comments: Comment[]
  limit: number
  offset: number
  has_next: boolean
}

export interface CommentResponse {
  comment: Comment
}

export interface FollowResponse {
  follow: {
    id: number
    is_accepted: boolean
    created_at: string
  }
}

export type ReelLikeResponse = ToggleLikeResponse
