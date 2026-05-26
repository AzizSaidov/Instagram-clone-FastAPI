import type { PostUser } from './feed'

export type ConversationKind = 'chat' | 'group'

export interface DirectMessage {
  id: number
  text: string | null
  media_url: string | null
  is_read: boolean
  created_at: string
  sender: PostUser
}

export interface Chat {
  id: number
  created_at: string
  updated_at: string
  user_1: PostUser
  user_2: PostUser
  last_message: DirectMessage | null
}

export interface ChatsListResponse {
  chats: Chat[]
  limit: number
  offset: number
  has_next: boolean
}

export interface ChatResponse {
  chat: Chat
}

export interface DirectMessagesListResponse {
  messages: DirectMessage[]
  limit: number
  offset: number
  has_next: boolean
}

export interface DirectMessageResponse {
  message: DirectMessage
}

export interface Group {
  id: number
  name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  owner: PostUser
  members_count: number
  last_message: DirectMessage | null
}

export interface GroupsListResponse {
  groups: Group[]
  limit: number
  offset: number
  has_next: boolean
}

export interface GroupResponse {
  group: Group
}

export interface GroupMembersListResponse {
  users: PostUser[]
  limit: number
  offset: number
  has_next: boolean
}

export interface GroupMessagesListResponse {
  messages: DirectMessage[]
  limit: number
  offset: number
  has_next: boolean
}

export interface GroupMessageResponse {
  message: DirectMessage
}

export interface FollowRequestUser {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
  is_private: boolean
}

export interface FollowRequestsResponse {
  users: FollowRequestUser[]
  limit: number
  offset: number
  has_next: boolean
}

export interface ProfileSearchResponse {
  users: FollowRequestUser[]
  limit: number
  offset: number
  has_next: boolean
}

export interface ActiveConversation {
  kind: ConversationKind
  id: number
}
