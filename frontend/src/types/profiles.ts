import type { Post } from './feed'
import type { Reel } from './reels'
import type { MeResponse } from './auth'

export interface ProfileSearchUser {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
  is_private: boolean
}

export interface ProfileSearchResponse {
  users: ProfileSearchUser[]
  limit: number
  offset: number
  has_next: boolean
}

export interface FollowsListResponse {
  users: ProfileSearchUser[]
  limit: number
  offset: number
  has_next: boolean
}

export interface ProfilePage {
  id: number
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  is_private: boolean
  is_following: boolean
  is_follow_requested: boolean
  posts_count: number
  reels_count: number
  followers_count: number
  following_count: number
}

export interface ProfilePageResponse {
  profile: ProfilePage
  posts: Post[]
  reels: Reel[]
  pagination: {
    limit: number
    offset: number
    has_next: boolean
  }
}

export interface FollowResponse {
  follow: {
    id: number
    is_accepted: boolean
    created_at: string
    follower?: ProfileSearchUser
    following?: ProfileSearchUser
  }
}

export interface ProfileUpdatePayload {
  username?: string
  full_name?: string
  bio?: string
  is_private?: boolean
}

export interface SavedPost {
  id: number
  post_id: number
  created_at: string
  post: Post
}

export interface SavedPostsListResponse {
  saved_posts: SavedPost[]
  pagination: {
    limit: number
    offset: number
    has_next: boolean
  }
}

export type MyProfileResponse = MeResponse
