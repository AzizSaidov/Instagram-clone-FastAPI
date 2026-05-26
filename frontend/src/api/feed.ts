import api from './client'
import type {
  NoteResponse,
  PostResponse,
  NotesListResponse,
  PostsListResponse,
  StoriesListResponse,
  ToggleLikeResponse,
  ToggleSavedResponse,
} from '../types/feed'
import type { ProfileSearchResponse } from '../types/profiles'

export async function getFeedPosts(limit = 10, offset = 0) {
  const { data } = await api.get<PostsListResponse>('/posts/feed/', {
    params: { limit, offset },
  })
  return data
}

export async function getExplorePosts(limit = 24, offset = 0) {
  const { data } = await api.get<PostsListResponse>('/posts/explore/', {
    params: { limit, offset },
  })
  return data
}

export async function getPost(postId: number) {
  const { data } = await api.get<PostResponse>(`/posts/${postId}/`)
  return data
}

export async function deletePost(postId: number) {
  await api.delete(`/posts/${postId}/`)
}

export async function viewPost(postId: number) {
  const { data } = await api.post(`/posts/${postId}/view/`)
  return data
}

export async function getPostViewers(postId: number) {
  const { data } = await api.get<ProfileSearchResponse>(
    `/posts/${postId}/viewers/`,
  )
  return data
}

export async function togglePostLike(postId: number) {
  const { data } = await api.post<ToggleLikeResponse>(
    `/likes/posts/${postId}/`,
  )
  return data
}

export async function togglePostSaved(postId: number) {
  const { data } = await api.post<ToggleSavedResponse>(`/saved/${postId}/`)
  return data
}

export async function getStoriesFeed(limit = 50, offset = 0) {
  const { data } = await api.get<StoriesListResponse>('/stories/feed/', {
    params: { limit, offset },
  })
  return data
}

export async function viewStory(storyId: number) {
  const { data } = await api.post(`/stories/${storyId}/view/`)
  return data
}

export async function getStoryViewers(storyId: number) {
  const { data } = await api.get<ProfileSearchResponse>(
    `/stories/${storyId}/viewers/`,
  )
  return data
}

export async function deleteStory(storyId: number) {
  await api.delete(`/stories/${storyId}/`)
}

export async function getMyNote() {
  const { data } = await api.get<NoteResponse>('/notes/me/')
  return data
}

export async function createNote(text: string) {
  const { data } = await api.post<NoteResponse>('/notes/', { text })
  return data
}

export async function deleteMyNote() {
  const { data } = await api.delete('/notes/me/')
  return data
}

export async function getNotes(limit = 50, offset = 0) {
  const { data } = await api.get<NotesListResponse>('/notes/', {
    params: { limit, offset },
  })
  return data
}
