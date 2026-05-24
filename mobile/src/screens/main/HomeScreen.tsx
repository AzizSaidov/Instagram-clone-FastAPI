import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import type { Post, Story, User } from "../../api/types";
import { createStoryFromPost, getMe, getPosts, getStories, togglePostLike } from "../../api/resources";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { IconButton } from "../../components/IconButton";
import { Loading } from "../../components/Loading";
import { PostCard } from "../../components/PostCard";
import { Screen } from "../../components/Screen";
import { colors, spacing } from "../../theme/colors";

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [meResponse, postsResponse, storiesResponse] = await Promise.all([getMe(), getPosts(), getStories()]);
      setUser(meResponse.user);
      setPosts(postsResponse.posts);
      setStories(storiesResponse.stories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleShareToStory(postId: number) {
    try {
      await createStoryFromPost(postId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share post to story");
    }
  }

  if (loading) {
    return (
      <Screen noPadding>
        <Header navigation={navigation} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <>
            <Header navigation={navigation} />
            <StoriesRow
              stories={stories}
              profile={user?.profile}
              onCreate={() => navigation.navigate("Create", { mode: "story" })}
              onOpen={(storyId) => navigation.navigate("StoryViewer", { storyId })}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        }
        ListEmptyComponent={<EmptyState title="No posts yet" body="Create a post to see the feed fill up." />}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onOpen={() => navigation.navigate("PostDetail", { postId: item.id, authorUsername: item.user?.username })}
            onLike={() => togglePostLike(item.id).catch(() => undefined)}
            onComment={() => navigation.navigate("PostDetail", { postId: item.id, authorUsername: item.user?.username })}
            onShareToStory={() => handleShareToStory(item.id)}
          />
        )}
      />
    </Screen>
  );
}

function Header({ navigation }: { navigation: any }) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>InstaFast</Text>
      <View style={styles.headerActions}>
        <IconButton name="heart-outline" onPress={() => navigation.navigate("Notifications")} />
        <IconButton name="paper-plane-outline" onPress={() => navigation.navigate("Chats")} />
      </View>
    </View>
  );
}

function StoriesRow({
  stories,
  profile,
  onCreate,
  onOpen,
}: {
  stories: Story[];
  profile?: User["profile"];
  onCreate: () => void;
  onOpen: (storyId: number) => void;
}) {
  return (
    <View style={styles.stories}>
      <Pressable onPress={onCreate} style={styles.storyItem}>
        <Avatar size={62} story uri={profile?.avatar_url} username={profile?.username || "+"} />
        <View style={styles.addBadge}>
          <Text style={styles.addBadgeText}>+</Text>
        </View>
        <Text numberOfLines={1} style={styles.storyLabel}>Your story</Text>
      </Pressable>
      <FlatList
        data={stories}
        horizontal
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable onPress={() => onOpen(item.id)} style={styles.storyItem}>
            <Avatar size={62} story uri={item.user?.avatar_url} username={item.user?.username || "story"} />
            <Text numberOfLines={1} style={styles.storyLabel}>{item.user?.username || "story"}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.background,
    borderRadius: 11,
    borderWidth: 2,
    bottom: 18,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: 7,
    width: 22,
  },
  addBadgeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
  },
  logo: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  stories: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  storyItem: {
    alignItems: "center",
    marginRight: spacing.md,
    position: "relative",
    width: 72,
  },
  storyLabel: {
    color: colors.text,
    fontSize: 12,
    marginTop: spacing.xs,
    maxWidth: 72,
  },
});
