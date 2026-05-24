export type Pagination = {
  limit: number;
  offset: number;
  has_next: boolean;
};

export type Profile = {
  id: number;
  user_id?: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
  posts_count?: number;
  reels_count?: number;
  followers_count?: number;
  following_count?: number;
};

export type User = {
  id: number;
  phone_number: string;
  created_at: string;
  profile: Profile;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type AccessTokenResponse = {
  access_token: string;
  token_type: string;
};

export type MyProfileResponse = {
  user: User;
};

export type ProfileSearchResponse = Pagination & {
  users: Profile[];
};

export type CompactUser = {
  id: number;
  username: string;
  avatar_url: string | null;
};

export type PostMedia = {
  id: number;
  media_url: string;
  order_index: number;
};

export type Post = {
  id: number;
  user_id: number;
  description: string | null;
  hashtag: string | null;
  views_count: number;
  created_at: string;
  media: PostMedia[];
  user: CompactUser;
};

export type PostResponse = {
  post: Post;
};

export type PostsListResponse = Pagination & {
  posts: Post[];
};

export type Reel = {
  id: number;
  user_id: number;
  video_url: string;
  description: string | null;
  hashtag: string | null;
  views_count: number;
  created_at: string;
  user: CompactUser;
};

export type ReelResponse = {
  reel: Reel;
};

export type ReelsListResponse = Pagination & {
  reels: Reel[];
};

export type Story = {
  id: number;
  user_id: number;
  post_id: number | null;
  media_url: string | null;
  expires_at: string;
  views_count: number;
  created_at: string;
  user: CompactUser;
};

export type StoryResponse = {
  story: Story;
};

export type StoriesListResponse = Pagination & {
  stories: Story[];
};

export type ProfilePageResponse = {
  profile: Profile;
  posts: Post[];
  reels: Reel[];
  pagination: Pagination;
};

export type Comment = {
  id: number;
  post_id: number | null;
  reels_id: number | null;
  text: string;
  created_at: string;
  user: CompactUser;
};

export type CommentResponse = {
  comment: Comment;
};

export type CommentsListResponse = Pagination & {
  comments: Comment[];
};

export type Like = {
  id: number;
  post_id: number | null;
  comment_id: number | null;
  reels_id: number | null;
  created_at: string;
  user: CompactUser;
};

export type ToggleLikeResponse = {
  is_liked: boolean;
  like: Like | null;
};

export type LikesListResponse = Pagination & {
  likes: Like[];
};

export type NotificationItem = {
  id: number;
  type: string;
  post_id: number | null;
  reels_id: number | null;
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
  from_user: CompactUser;
};

export type NotificationsListResponse = Pagination & {
  notifications: NotificationItem[];
};

export type DirectMessage = {
  id: number;
  text: string | null;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender: CompactUser;
};

export type Chat = {
  id: number;
  created_at: string;
  updated_at: string;
  user_1: CompactUser;
  user_2: CompactUser;
  last_message: DirectMessage | null;
};

export type ChatResponse = {
  chat: Chat;
};

export type ChatsListResponse = Pagination & {
  chats: Chat[];
};

export type DirectMessagesListResponse = Pagination & {
  messages: DirectMessage[];
};

export type FollowProfile = {
  id: number;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_private: boolean;
};

export type Follow = {
  id: number;
  is_accepted: boolean;
  created_at: string;
  follower: FollowProfile;
  following: FollowProfile;
};

export type FollowResponse = {
  follow: Follow;
};

export type FollowsListResponse = Pagination & {
  users: FollowProfile[];
};

export type BlackListItem = {
  id: number;
  username: string;
  avatar_url: string | null;
};

export type BlackListResponse = {
  blacklist: {
    id: number;
    created_at: string;
    blocked_user: BlackListItem;
  };
};

export type BlackListListResponse = Pagination & {
  users: BlackListItem[];
};

export type Note = {
  id: number;
  text: string;
  expires_at: string;
  created_at: string;
  user: CompactUser;
};

export type NoteResponse = {
  note: Note;
};

export type NotesListResponse = Pagination & {
  notes: Note[];
};

export type GroupMessage = {
  id: number;
  text: string | null;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender: CompactUser;
};

export type Group = {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  owner: CompactUser;
  members_count: number;
  last_message: GroupMessage | null;
};

export type GroupResponse = {
  group: Group;
};

export type GroupsListResponse = Pagination & {
  groups: Group[];
};

export type GroupMembersListResponse = Pagination & {
  users: CompactUser[];
};

export type GroupMessageResponse = {
  message: GroupMessage;
};

export type GroupMessagesListResponse = Pagination & {
  messages: GroupMessage[];
};
