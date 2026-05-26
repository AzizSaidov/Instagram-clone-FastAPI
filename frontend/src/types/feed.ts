export interface PostMedia {
  id: number
  media_url: string
  order_index: number
}

export interface PostUser {
  id: number
  username: string
  avatar_url: string | null
}

export interface Post {
  id: number
  user_id: number
  description: string | null
  hashtag: string | null
  views_count: number
  likes_count: number
  comments_count: number
  is_liked: boolean
  is_saved: boolean
  created_at: string
  media: PostMedia[]
  user: PostUser
}

export interface PostsListResponse {
  posts: Post[]
  limit: number
  offset: number
  has_next: boolean
}

export interface PostResponse {
  post: Post
}

export interface ToggleLikeResponse {
  is_liked: boolean
  like: unknown | null
}

export interface ToggleSavedResponse {
  is_saved: boolean
  message: string
}

export interface Story {
  id: number
  user_id: number
  post_id: number | null
  media_url: string | null
  expires_at: string
  views_count: number
  is_viewed: boolean
  created_at: string
  user: PostUser
}

export interface StoriesListResponse {
  stories: Story[]
  limit: number
  offset: number
  has_next: boolean
}

export interface StoryResponse {
  story: Story
}

export interface Note {
  id: number
  text: string
  expires_at: string
  created_at: string
  user: PostUser
}

export interface NoteResponse {
  note: Note
}

export interface NotesListResponse {
  notes: Note[]
  limit: number
  offset: number
  has_next: boolean
}
