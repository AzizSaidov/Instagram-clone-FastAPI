import api from './client'
import type {
  ChatResponse,
  ChatsListResponse,
  DirectMessageResponse,
  DirectMessagesListResponse,
  FollowRequestsResponse,
  GroupMembersListResponse,
  GroupMessageResponse,
  GroupMessagesListResponse,
  GroupResponse,
  GroupsListResponse,
  ProfileSearchResponse,
} from '../types/messages'

export async function getChats(limit = 20, offset = 0) {
  const { data } = await api.get<ChatsListResponse>('/chats/', {
    params: { limit, offset },
  })
  return data
}

export async function createChat(username: string) {
  const { data } = await api.post<ChatResponse>(`/chats/${username}/`)
  return data
}

export async function deleteChat(chatId: number) {
  const { data } = await api.delete(`/chats/${chatId}/`)
  return data
}

export async function getChatMessages(chatId: number, limit = 30, offset = 0) {
  const { data } = await api.get<DirectMessagesListResponse>(
    `/chats/${chatId}/messages/`,
    { params: { limit, offset } },
  )
  return data
}

export async function sendChatMessage(
  chatId: number,
  payload: { text?: string; file?: File | null },
) {
  const formData = new FormData()

  if (payload.text) {
    formData.append('text', payload.text)
  }

  if (payload.file) {
    formData.append('file', payload.file)
  }

  const { data } = await api.post<DirectMessageResponse>(
    `/chats/${chatId}/messages/`,
    formData,
  )
  return data
}

export async function markChatRead(chatId: number) {
  const { data } = await api.put(`/chats/${chatId}/read/`)
  return data
}

export async function getGroups(limit = 20, offset = 0) {
  const { data } = await api.get<GroupsListResponse>('/groups/', {
    params: { limit, offset },
  })
  return data
}

export async function createGroup(payload: { name: string; avatar_url?: string | null }) {
  const { data } = await api.post<GroupResponse>('/groups/', payload)
  return data
}

export async function getGroup(groupId: number) {
  const { data } = await api.get<GroupResponse>(`/groups/${groupId}/`)
  return data
}

export async function updateGroup(
  groupId: number,
  payload: { name?: string; avatar_url?: string | null },
) {
  const { data } = await api.put<GroupResponse>(`/groups/${groupId}/`, payload)
  return data
}

export async function uploadGroupAvatar(groupId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<GroupResponse>(
    `/groups/${groupId}/avatar/`,
    formData,
  )
  return data
}

export async function deleteGroup(groupId: number) {
  const { data } = await api.delete(`/groups/${groupId}/`)
  return data
}

export async function getGroupMembers(groupId: number, limit = 50, offset = 0) {
  const { data } = await api.get<GroupMembersListResponse>(
    `/groups/${groupId}/members/`,
    { params: { limit, offset } },
  )
  return data
}

export async function addGroupMember(groupId: number, username: string) {
  const { data } = await api.post<GroupResponse>(
    `/groups/${groupId}/members/${username}/`,
  )
  return data
}

export async function removeGroupMember(groupId: number, username: string) {
  const { data } = await api.delete(`/groups/${groupId}/members/${username}/`)
  return data
}

export async function leaveGroup(groupId: number) {
  const { data } = await api.post(`/groups/${groupId}/leave/`)
  return data
}

export async function getGroupMessages(groupId: number, limit = 30, offset = 0) {
  const { data } = await api.get<GroupMessagesListResponse>(
    `/groups/${groupId}/messages/`,
    { params: { limit, offset } },
  )
  return data
}

export async function sendGroupMessage(
  groupId: number,
  payload: { text?: string; file?: File | null },
) {
  const formData = new FormData()

  if (payload.text) {
    formData.append('text', payload.text)
  }

  if (payload.file) {
    formData.append('file', payload.file)
  }

  const { data } = await api.post<GroupMessageResponse>(
    `/groups/${groupId}/messages/`,
    formData,
  )
  return data
}

export async function markGroupRead(groupId: number) {
  const { data } = await api.put(`/groups/${groupId}/read/`)
  return data
}

export async function getFollowRequests(limit = 20, offset = 0) {
  const { data } = await api.get<FollowRequestsResponse>('/follows/requests/', {
    params: { limit, offset },
  })
  return data
}

export async function acceptFollowRequest(username: string) {
  const { data } = await api.post(`/follows/requests/${username}/accept/`)
  return data
}

export async function rejectFollowRequest(username: string) {
  const { data } = await api.delete(`/follows/requests/${username}/reject/`)
  return data
}

export async function searchProfiles(query: string, limit = 10, offset = 0) {
  const { data } = await api.get<ProfileSearchResponse>('/profiles/search/', {
    params: { query, limit, offset },
  })
  return data
}
