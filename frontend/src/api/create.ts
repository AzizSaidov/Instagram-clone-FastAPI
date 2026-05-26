import api from './client'
import type { PostResponse, StoryResponse } from '../types/feed'
import type { ReelResponse } from '../types/reels'

export async function createPost(payload: {
  files: File[]
  description?: string
  hashtag?: string
}) {
  const formData = new FormData()

  payload.files.forEach((file) => {
    formData.append('files', file)
  })

  if (payload.description) {
    formData.append('description', payload.description)
  }

  if (payload.hashtag) {
    formData.append('hashtag', payload.hashtag)
  }

  const { data } = await api.post<PostResponse>('/posts/', formData)
  return data
}

export async function createReel(payload: {
  file: File
  description?: string
  hashtag?: string
}) {
  const formData = new FormData()
  formData.append('file', payload.file)

  if (payload.description) {
    formData.append('description', payload.description)
  }

  if (payload.hashtag) {
    formData.append('hashtag', payload.hashtag)
  }

  const { data } = await api.post<ReelResponse>('/reels/', formData)
  return data
}

export async function createStory(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<StoryResponse>('/stories/', formData)
  return data
}
