import api from './client'
import type {
  CommentResponse,
  CommentsListResponse,
  FollowResponse,
  ReelLikeResponse,
  ReelResponse,
  ReelsListResponse,
} from '../types/reels'
import type { ProfileSearchResponse } from '../types/profiles'

export async function getReelsFeed(limit = 6, offset = 0) {
  const { data } = await api.get<ReelsListResponse>('/reels/feed/', {
    params: { limit, offset },
  })
  return data
}

export async function toggleReelLike(reelsId: number) {
  const { data } = await api.post<ReelLikeResponse>(`/likes/reels/${reelsId}/`)
  return data
}

export async function updateReelView(reelsId: number, watchedPercent: number) {
  const { data } = await api.post<ReelResponse>(`/reels/${reelsId}/view/`, {
    watched_percent: watchedPercent,
  })
  return data
}

export async function getReelViewers(reelsId: number) {
  const { data } = await api.get<ProfileSearchResponse>(
    `/reels/${reelsId}/viewers/`,
  )
  return data
}

export async function getReelComments(
  reelsId: number,
  limit = 20,
  offset = 0,
) {
  const { data } = await api.get<CommentsListResponse>(
    `/comments/reels/${reelsId}/`,
    { params: { limit, offset } },
  )
  return data
}

export async function addReelComment(reelsId: number, text: string) {
  const { data } = await api.post<CommentResponse>(
    `/comments/reels/${reelsId}/`,
    { text },
  )
  return data
}

export async function followUser(username: string) {
  const { data } = await api.post<FollowResponse>(`/follows/${username}/`)
  return data
}
