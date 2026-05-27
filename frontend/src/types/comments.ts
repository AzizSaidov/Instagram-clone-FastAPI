import type { PostUser } from './feed'

export interface Comment {
  id: number
  post_id: number | null
  reels_id: number | null
  text: string
  likes_count: number
  is_liked: boolean
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
