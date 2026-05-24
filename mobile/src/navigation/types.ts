import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: { registeredLogin?: string } | undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Create: { mode?: "post" | "reel" | "story" } | undefined;
  Reels: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  PublicProfile: { username: string };
  EditProfile: undefined;
  PostDetail: { postId: number; authorUsername?: string };
  StoryViewer: { storyId: number };
  FollowList: { username: string; type: "followers" | "following" };
  Chats: undefined;
  ChatDetail: { chatId: number; username?: string };
  Notifications: undefined;
};
