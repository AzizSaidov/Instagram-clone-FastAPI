import api from './client'
import type { CommentResponse, CommentsListResponse } from '../types/comments'
import type { ToggleLikeResponse } from '../types/feed'

export async function getPostComments(postId: number, limit = 30, offset = 0) {
  const { data } = await api.get<CommentsListResponse>(
    `/comments/posts/${postId}/`,
    { params: { limit, offset } },
  )
  return data
}

export async function createPostComment(postId: number, text: string) {
  const { data } = await api.post<CommentResponse>(
    `/comments/posts/${postId}/`,
    { text },
  )
  return data
}

export async function deleteComment(commentId: number) {
  const { data } = await api.delete(`/comments/${commentId}/`)
  return data
}

export async function toggleCommentLike(commentId: number) {
  const { data } = await api.post<ToggleLikeResponse>(
    `/likes/comments/${commentId}/`,
  )
  return data
}
