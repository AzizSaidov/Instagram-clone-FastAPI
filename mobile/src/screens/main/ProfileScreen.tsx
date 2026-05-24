import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { getMe, getProfile } from "../../api/resources";
import type { Post, Profile, Reel, User } from "../../api/types";
import { mediaUrl } from "../../config/api";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../theme/colors";

type GridItem = { id: string; image?: string; type: "post" | "reel"; postId?: number };

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [profileStats, setProfileStats] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [tab, setTab] = useState<"posts" | "reels">("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const meResponse = await getMe();
      const pageResponse = await getProfile(meResponse.user.profile.username);
      setUser(meResponse.user);
      setProfileStats(pageResponse.profile);
      setPosts(pageResponse.posts);
      setReels(pageResponse.reels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const profile = user?.profile;
  const displayProfile = profileStats || profile;
  const showFullName = Boolean(
    profile?.full_name &&
      profile.username &&
      profile.full_name.trim().toLowerCase() !== profile.username.trim().toLowerCase(),
  );
  const grid: GridItem[] =
    tab === "posts"
      ? posts.map((post) => ({ id: `post-${post.id}`, image: post.media[0]?.media_url, type: "post", postId: post.id }))
      : reels.map((reel) => ({ id: `reel-${reel.id}`, image: reel.video_url, type: "reel" }));

  return (
    <Screen noPadding>
      <FlatList
        data={grid}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <Text style={styles.username}>{profile?.username || "Profile"}</Text>
              <Pressable onPress={signOut} style={styles.logout}>
                <Ionicons name="log-out-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.profileHeader}>
              <Avatar uri={profile?.avatar_url} username={profile?.username} size={84} />
              <View style={styles.stats}>
                <Stat label="Posts" value={displayProfile?.posts_count ?? posts.length} />
                <Stat
                  label="Followers"
                  value={displayProfile?.followers_count ?? 0}
                  onPress={() => profile?.username && navigation.navigate("FollowList", { username: profile.username, type: "followers" })}
                />
                <Stat
                  label="Following"
                  value={displayProfile?.following_count ?? 0}
                  onPress={() => profile?.username && navigation.navigate("FollowList", { username: profile.username, type: "following" })}
                />
              </View>
            </View>
            <View style={styles.bio}>
              {showFullName ? <Text style={styles.name}>{profile?.full_name}</Text> : null}
              {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
            </View>
            <View style={styles.actions}>
              <PrimaryButton title="Edit profile" variant="secondary" onPress={() => navigation.navigate("EditProfile")} style={styles.actionButton} />
              <PrimaryButton title="Messages" variant="secondary" onPress={() => navigation.navigate("Chats")} style={styles.actionButton} />
            </View>
            <View style={styles.tabs}>
              <Pressable onPress={() => setTab("posts")} style={[styles.tab, tab === "posts" && styles.tabActive]}>
                <Ionicons name="grid-outline" size={22} color={tab === "posts" ? colors.text : colors.muted} />
              </Pressable>
              <Pressable onPress={() => setTab("reels")} style={[styles.tab, tab === "reels" && styles.tabActive]}>
                <Ionicons name="play-circle-outline" size={22} color={tab === "reels" ? colors.text : colors.muted} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title={`No ${tab} yet`} />}
        renderItem={({ item }) => (
          <Pressable style={styles.gridItem} onPress={() => item.postId && navigation.navigate("PostDetail", { postId: item.postId, authorUsername: profile?.username })}>
            {item.image ? <Image source={{ uri: mediaUrl(item.image) }} style={styles.gridImage} /> : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string | number; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  bio: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  bioText: {
    color: colors.text,
    lineHeight: 20,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.md,
  },
  gridImage: {
    height: "100%",
    width: "100%",
  },
  gridItem: {
    aspectRatio: 1,
    backgroundColor: colors.elevated,
    borderColor: colors.background,
    borderWidth: 1,
    width: "33.333%",
  },
  logout: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  name: {
    color: colors.text,
    fontWeight: "800",
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    padding: spacing.md,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  stats: {
    flex: 1,
    flexDirection: "row",
  },
  tab: {
    alignItems: "center",
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  tabActive: {
    borderBottomColor: colors.text,
    borderBottomWidth: 1,
  },
  tabs: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  username: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
});
