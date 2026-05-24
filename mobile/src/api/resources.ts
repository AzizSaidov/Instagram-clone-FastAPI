import { apiRequest } from "./client";
import type {
  AccessTokenResponse,
  AuthTokens,
  BlackListListResponse,
  BlackListResponse,
  ChatResponse,
  ChatsListResponse,
  CommentResponse,
  CommentsListResponse,
  DirectMessagesListResponse,
  FollowResponse,
  FollowsListResponse,
  GroupMembersListResponse,
  GroupMessageResponse,
  GroupMessagesListResponse,
  GroupResponse,
  GroupsListResponse,
  LikesListResponse,
  MyProfileResponse,
  NoteResponse,
  NotesListResponse,
  NotificationsListResponse,
  PostResponse,
  PostsListResponse,
  ProfilePageResponse,
  ProfileSearchResponse,
  ReelResponse,
  ReelsListResponse,
  StoriesListResponse,
  StoryResponse,
  ToggleLikeResponse,
} from "./types";

export type PageParams = {
  limit?: number;
  offset?: number;
};

export function registerUser(data: { phone_number: string; username: string; password: string }) {
  return apiRequest<MyProfileResponse>("/users/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data: { login: string; password: string }) {
  return apiRequest<AuthTokens>("/users/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function refreshAccessToken(refreshToken: string) {
  return apiRequest<AccessTokenResponse>("/users/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function changePassword(data: { old_password: string; new_password: string }) {
  return apiRequest<{ message?: string }>("/users/change-password/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return apiRequest<MyProfileResponse>("/profiles/me/");
}

export function updateMe(data: {
  username?: string;
  full_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  is_private?: boolean;
}) {
  return apiRequest<MyProfileResponse>("/profiles/me/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function uploadAvatar(form: FormData) {
  return apiRequest<MyProfileResponse>("/profiles/me/avatar/", {
    method: "POST",
    body: form,
  });
}

export function searchProfiles(query: string, params: PageParams = {}) {
  return apiRequest<ProfileSearchResponse>("/profiles/search/", {
    params: { query, limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getProfile(username: string, params: PageParams = {}) {
  return apiRequest<ProfilePageResponse>(`/profiles/${encodeURIComponent(username)}/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function followUser(username: string) {
  return apiRequest<FollowResponse>(`/follows/${encodeURIComponent(username)}/`, { method: "POST" });
}

export function unfollowUser(username: string) {
  return apiRequest(`/follows/${encodeURIComponent(username)}/`, { method: "DELETE" });
}

export function getFollowers(username: string, params: PageParams = {}) {
  return apiRequest<FollowsListResponse>(`/follows/${encodeURIComponent(username)}/followers/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getFollowing(username: string, params: PageParams = {}) {
  return apiRequest<FollowsListResponse>(`/follows/${encodeURIComponent(username)}/following/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getFollowRequests(params: PageParams = {}) {
  return apiRequest<FollowsListResponse>("/follows/requests/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function acceptFollowRequest(username: string) {
  return apiRequest<FollowResponse>(`/follows/requests/${encodeURIComponent(username)}/accept/`, { method: "POST" });
}

export function rejectFollowRequest(username: string) {
  return apiRequest(`/follows/requests/${encodeURIComponent(username)}/reject/`, { method: "DELETE" });
}

export function getPosts(params: PageParams = {}) {
  return apiRequest<PostsListResponse>("/posts/my/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getPost(postId: number) {
  return apiRequest<PostResponse>(`/posts/${postId}/`);
}

export function createPost(form: FormData) {
  return apiRequest<PostResponse>("/posts/", {
    method: "POST",
    body: form,
  });
}

export function createPostView(postId: number) {
  return apiRequest<PostResponse>(`/posts/${postId}/view/`, { method: "POST" });
}

export function getStories(params: PageParams = {}) {
  return apiRequest<StoriesListResponse>("/stories/my/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getStory(storyId: number) {
  return apiRequest<StoryResponse>(`/stories/${storyId}/`);
}

export function createStory(form: FormData) {
  return apiRequest<StoryResponse>("/stories/", {
    method: "POST",
    body: form,
  });
}

export function createStoryFromPost(postId: number) {
  return apiRequest<StoryResponse>(`/stories/from-post/${postId}/`, { method: "POST" });
}

export function createStoryView(storyId: number) {
  return apiRequest<StoryResponse>(`/stories/${storyId}/views/`, { method: "POST" });
}

export function createStoryViewLegacy(storyId: number) {
  return apiRequest<StoryResponse>(`/stories/${storyId}/view/`, { method: "POST" });
}

export function getReels(params: PageParams = {}) {
  return apiRequest<ReelsListResponse>("/reels/my/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getReel(reelsId: number) {
  return apiRequest<ReelResponse>(`/reels/${reelsId}/`);
}

export function createReel(form: FormData) {
  return apiRequest<ReelResponse>("/reels/", {
    method: "POST",
    body: form,
  });
}

export function updateReelView(reelsId: number, watchedPercent: number) {
  return apiRequest<ReelResponse>(`/reels/${reelsId}/view/`, {
    method: "POST",
    body: JSON.stringify({ watched_percent: watchedPercent }),
  });
}

export function getPostComments(postId: number, params: PageParams = {}) {
  return apiRequest<CommentsListResponse>(`/comments/posts/${postId}/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function addPostComment(postId: number, text: string) {
  return apiRequest<CommentResponse>(`/comments/posts/${postId}/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function getReelComments(reelsId: number, params: PageParams = {}) {
  return apiRequest<CommentsListResponse>(`/comments/reels/${reelsId}/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function addReelComment(reelsId: number, text: string) {
  return apiRequest<CommentResponse>(`/comments/reels/${reelsId}/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function updateComment(commentId: number, text: string) {
  return apiRequest<CommentResponse>(`/comments/${commentId}/`, {
    method: "PUT",
    body: JSON.stringify({ text }),
  });
}

export function deleteComment(commentId: number) {
  return apiRequest(`/comments/${commentId}/`, { method: "DELETE" });
}

export function togglePostLike(postId: number) {
  return apiRequest<ToggleLikeResponse>(`/likes/posts/${postId}/`, { method: "POST" });
}

export function getPostLikes(postId: number, params: PageParams = {}) {
  return apiRequest<LikesListResponse>(`/likes/posts/${postId}/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function toggleReelLike(reelsId: number) {
  return apiRequest<ToggleLikeResponse>(`/likes/reels/${reelsId}/`, { method: "POST" });
}

export function getReelLikes(reelsId: number, params: PageParams = {}) {
  return apiRequest<LikesListResponse>(`/likes/reels/${reelsId}/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function toggleCommentLike(commentId: number) {
  return apiRequest<ToggleLikeResponse>(`/likes/comments/${commentId}/`, { method: "POST" });
}

export function getCommentLikes(commentId: number, params: PageParams = {}) {
  return apiRequest<LikesListResponse>(`/likes/comments/${commentId}/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function blockUser(username: string) {
  return apiRequest<BlackListResponse>(`/blacklist/${encodeURIComponent(username)}/`, { method: "POST" });
}

export function unblockUser(username: string) {
  return apiRequest(`/blacklist/${encodeURIComponent(username)}/`, { method: "DELETE" });
}

export function getBlockedUsers(params: PageParams = {}) {
  return apiRequest<BlackListListResponse>("/blacklist/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function createNote(text: string) {
  return apiRequest<NoteResponse>("/notes/", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function getMyNote() {
  return apiRequest<NoteResponse>("/notes/me/");
}

export function deleteMyNote() {
  return apiRequest("/notes/me/", { method: "DELETE" });
}

export function getNotes(params: PageParams = {}) {
  return apiRequest<NotesListResponse>("/notes/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getChats(params: PageParams = {}) {
  return apiRequest<ChatsListResponse>("/chats/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function createOrOpenChat(username: string) {
  return apiRequest<ChatResponse>(`/chats/${encodeURIComponent(username)}/`, { method: "POST" });
}

export function getChat(chatId: number) {
  return apiRequest<ChatResponse>(`/chats/${chatId}/`);
}

export function getChatMessages(chatId: number, params: PageParams = {}) {
  return apiRequest<DirectMessagesListResponse>(`/chats/${chatId}/messages/`, {
    params: { limit: params.limit ?? 50, offset: params.offset ?? 0 },
  });
}

export function sendMessage(chatId: number, form: FormData) {
  return apiRequest(`/chats/${chatId}/messages/`, {
    method: "POST",
    body: form,
  });
}

export function markChatRead(chatId: number) {
  return apiRequest(`/chats/${chatId}/read/`, { method: "PUT" });
}

export function createGroup(data: { name: string; avatar_url?: string | null }) {
  return apiRequest<GroupResponse>("/groups/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getGroups(params: PageParams = {}) {
  return apiRequest<GroupsListResponse>("/groups/", {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function getGroup(groupId: number) {
  return apiRequest<GroupResponse>(`/groups/${groupId}/`);
}

export function updateGroup(groupId: number, data: { name?: string | null; avatar_url?: string | null }) {
  return apiRequest<GroupResponse>(`/groups/${groupId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteGroup(groupId: number) {
  return apiRequest(`/groups/${groupId}/`, { method: "DELETE" });
}

export function getGroupMembers(groupId: number, params: PageParams = {}) {
  return apiRequest<GroupMembersListResponse>(`/groups/${groupId}/members/`, {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  });
}

export function addGroupMember(groupId: number, username: string) {
  return apiRequest<GroupResponse>(`/groups/${groupId}/members/${encodeURIComponent(username)}/`, { method: "POST" });
}

export function removeGroupMember(groupId: number, username: string) {
  return apiRequest(`/groups/${groupId}/members/${encodeURIComponent(username)}/`, { method: "DELETE" });
}

export function leaveGroup(groupId: number) {
  return apiRequest(`/groups/${groupId}/leave/`, { method: "POST" });
}

export function getGroupMessages(groupId: number, params: PageParams = {}) {
  return apiRequest<GroupMessagesListResponse>(`/groups/${groupId}/messages/`, {
    params: { limit: params.limit ?? 50, offset: params.offset ?? 0 },
  });
}

export function sendGroupMessage(groupId: number, form: FormData) {
  return apiRequest<GroupMessageResponse>(`/groups/${groupId}/messages/`, {
    method: "POST",
    body: form,
  });
}

export function markGroupRead(groupId: number) {
  return apiRequest(`/groups/${groupId}/read/`, { method: "PUT" });
}

export function getNotifications(params: PageParams = {}) {
  return apiRequest<NotificationsListResponse>("/notifications/", {
    params: { limit: params.limit ?? 30, offset: params.offset ?? 0 },
  });
}

export function markNotificationRead(notificationId: number) {
  return apiRequest(`/notifications/${notificationId}/read/`, { method: "PUT" });
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all/", { method: "PUT" });
}
