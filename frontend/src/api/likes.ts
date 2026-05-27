import api from './client'
import type { ProfileSearchResponse, ProfileSearchUser } from '../types/profiles'

interface LikeUser {
  id: number
  username: string
  avatar_url: string | null
}

interface LikeRead {
  id: number
  user: LikeUser
}

interface LikesListResponse {
  likes: LikeRead[]
  limit: number
  offset: number
  has_next: boolean
}

function toProfileSearchResponse(data: LikesListResponse): ProfileSearchResponse {
  const users: ProfileSearchUser[] = data.likes.map((like) => ({
    id: like.user.id,
    username: like.user.username,
    full_name: null,
    avatar_url: like.user.avatar_url,
    is_private: false,
  }))

  return {
    users,
    limit: data.limit,
    offset: data.offset,
    has_next: data.has_next,
  }
}

export async function getPostLikeUsers(postId: number) {
  const { data } = await api.get<LikesListResponse>(`/likes/posts/${postId}/`)
  return toProfileSearchResponse(data)
}

export async function getReelLikeUsers(reelsId: number) {
  const { data } = await api.get<LikesListResponse>(`/likes/reels/${reelsId}/`)
  return toProfileSearchResponse(data)
}

export async function getCommentLikeUsers(commentId: number) {
  const { data } = await api.get<LikesListResponse>(
    `/likes/comments/${commentId}/`,
  )
  return toProfileSearchResponse(data)
}
