import api from './client'
import type {
  FollowResponse,
  FollowsListResponse,
  MyProfileResponse,
  ProfilePageResponse,
  ProfileSearchResponse,
  ProfileUpdatePayload,
  SavedPostsListResponse,
} from '../types/profiles'
import type { PostsListResponse } from '../types/feed'

export async function searchProfiles(query: string, limit = 20, offset = 0) {
  const { data } = await api.get<ProfileSearchResponse>('/profiles/search/', {
    params: { query, limit, offset },
  })
  return data
}

export async function getProfileRecommendations(limit = 5, offset = 0) {
  const { data } = await api.get<ProfileSearchResponse>(
    '/profiles/recommendations/',
    { params: { limit, offset } },
  )
  return data
}

export async function getProfile(username: string, limit = 1, offset = 0) {
  const { data } = await api.get<ProfilePageResponse>(
    `/profiles/${username}/`,
    { params: { limit, offset } },
  )
  return data
}

export async function updateMyProfile(payload: ProfileUpdatePayload) {
  const { data } = await api.put<MyProfileResponse>('/profiles/me/', payload)
  return data
}

export async function uploadMyAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<MyProfileResponse>(
    '/profiles/me/avatar/',
    formData,
  )
  return data
}

export async function deleteMyAvatar() {
  const { data } = await api.delete<MyProfileResponse>('/profiles/me/avatar/')
  return data
}

export async function getMyPosts(limit = 30, offset = 0) {
  const { data } = await api.get<PostsListResponse>('/posts/my/', {
    params: { limit, offset },
  })
  return data
}

export async function getSavedPosts(limit = 30, offset = 0) {
  const { data } = await api.get<SavedPostsListResponse>('/saved/', {
    params: { limit, offset },
  })
  return data
}

export async function getFollowers(username: string, limit = 20, offset = 0) {
  const { data } = await api.get<FollowsListResponse>(
    `/follows/${username}/followers/`,
    { params: { limit, offset } },
  )
  return data
}

export async function getFollowing(username: string, limit = 20, offset = 0) {
  const { data } = await api.get<FollowsListResponse>(
    `/follows/${username}/following/`,
    { params: { limit, offset } },
  )
  return data
}

export async function followProfile(username: string) {
  const { data } = await api.post<FollowResponse>(`/follows/${username}/`)
  return data
}

export async function unfollowProfile(username: string) {
  const { data } = await api.delete(`/follows/${username}/`)
  return data
}

export async function removeFollower(username: string) {
  const { data } = await api.delete(`/follows/followers/${username}/`)
  return data
}

export async function blockProfile(username: string) {
  const { data } = await api.post(`/blacklist/${username}/`)
  return data
}

export async function unblockProfile(username: string) {
  const { data } = await api.delete(`/blacklist/${username}/`)
  return data
}

export async function getBlockedProfiles(limit = 50, offset = 0) {
  const { data } = await api.get<ProfileSearchResponse>('/blacklist/', {
    params: { limit, offset },
  })
  return data
}
