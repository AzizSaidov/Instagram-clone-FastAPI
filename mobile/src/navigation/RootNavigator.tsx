import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ChatDetailScreen } from "../screens/main/ChatDetailScreen";
import { ChatsListScreen } from "../screens/main/ChatsListScreen";
import { EditProfileScreen } from "../screens/main/EditProfileScreen";
import { FollowListScreen } from "../screens/main/FollowListScreen";
import { NotificationsScreen } from "../screens/main/NotificationsScreen";
import { PostDetailScreen } from "../screens/main/PostDetailScreen";
import { PublicProfileScreen } from "../screens/main/PublicProfileScreen";
import { StoryViewerScreen } from "../screens/main/StoryViewerScreen";
import { colors } from "../theme/colors";
import { AppTabs } from "./AppTabs";
import type { AuthStackParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.background,
    primary: colors.primary,
    text: colors.text,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: "Log in" }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Create account" }} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <RootStack.Screen name="MainTabs" component={AppTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: "Profile" }} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit profile" }} />
      <RootStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: "Post" }} />
      <RootStack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false }} />
      <RootStack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={({ route }) => ({ title: route.params.type === "followers" ? "Followers" : "Following" })}
      />
      <RootStack.Screen name="Chats" component={ChatsListScreen} options={{ title: "Messages" }} />
      <RootStack.Screen name="ChatDetail" component={ChatDetailScreen} options={({ route }) => ({ title: route.params.username || "Chat" })} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <NavigationContainer documentTitle={{ formatter: () => "InstaFast" }} theme={navigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
});
