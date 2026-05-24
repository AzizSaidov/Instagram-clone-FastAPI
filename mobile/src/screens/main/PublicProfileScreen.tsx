import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { followUser, getProfile, unfollowUser } from "../../api/resources";
import type { Post, ProfilePageResponse, Reel } from "../../api/types";
import { mediaUrl } from "../../config/api";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "PublicProfile">;
type GridItem = { id: string; image?: string; type: "post" | "reel"; postId?: number };

export function PublicProfileScreen({ route, navigation }: Props) {
  const { username } = route.params;
  const [data, setData] = useState<ProfilePageResponse | null>(null);
  const [tab, setTab] = useState<"posts" | "reels">("posts");
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getProfile(username));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleFollow() {
    setFollowBusy(true);
    setError(null);
    try {
      if (following) {
        await unfollowUser(username);
      } else {
        await followUser(username);
      }
      setFollowing((value) => !value);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow action failed");
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const profile = data?.profile;
  const grid: GridItem[] =
    tab === "posts"
      ? (data?.posts || []).map((post: Post) => ({ id: `post-${post.id}`, image: post.media[0]?.media_url, type: "post", postId: post.id }))
      : (data?.reels || []).map((reel: Reel) => ({ id: `reel-${reel.id}`, image: reel.video_url, type: "reel" }));

  return (
    <Screen noPadding>
      <FlatList
        data={grid}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.profileHeader}>
              <Avatar uri={profile?.avatar_url} username={profile?.username} size={84} />
              <View style={styles.stats}>
                <Stat label="Posts" value={profile?.posts_count ?? data?.posts.length ?? 0} />
                <Stat
                  label="Followers"
                  value={profile?.followers_count ?? 0}
                  onPress={() => profile?.username && navigation.navigate("FollowList", { username: profile.username, type: "followers" })}
                />
                <Stat
                  label="Following"
                  value={profile?.following_count ?? 0}
                  onPress={() => profile?.username && navigation.navigate("FollowList", { username: profile.username, type: "following" })}
                />
              </View>
            </View>
            <View style={styles.bio}>
              <Text style={styles.name}>{profile?.username}</Text>
              {profile?.full_name && profile.full_name.trim().toLowerCase() !== profile.username.trim().toLowerCase() ? (
                <Text style={styles.fullName}>{profile.full_name}</Text>
              ) : null}
              {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
              {profile?.is_private ? <Text style={styles.privateText}>Private account</Text> : null}
            </View>
            <View style={styles.actions}>
              <PrimaryButton title={following ? "Unfollow" : "Follow"} onPress={toggleFollow} loading={followBusy} style={styles.actionButton} />
              <PrimaryButton title="Message" variant="secondary" onPress={() => navigation.navigate("Chats")} style={styles.actionButton} />
            </View>
            <View style={styles.tabs}>
              <Pressable onPress={() => setTab("posts")} style={[styles.tab, tab === "posts" && styles.tabActive]}>
                <Text style={[styles.tabText, tab === "posts" && styles.tabTextActive]}>POSTS</Text>
              </Pressable>
              <Pressable onPress={() => setTab("reels")} style={[styles.tab, tab === "reels" && styles.tabActive]}>
                <Text style={[styles.tabText, tab === "reels" && styles.tabTextActive]}>REELS</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title={`No ${tab}`} body={profile?.is_private ? "This profile is private or not visible yet." : undefined} />}
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
    padding: spacing.md,
  },
  fullName: {
    color: colors.text,
  },
  gridImage: {
    height: "100%",
    width: "100%",
  },
  gridItem: {
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderColor: colors.background,
    borderWidth: 1,
    width: "33.333%",
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  privateText: {
    color: colors.muted,
    fontWeight: "700",
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
    minHeight: 44,
    justifyContent: "center",
  },
  tabActive: {
    borderBottomColor: colors.text,
    borderBottomWidth: 1,
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  tabTextActive: {
    color: colors.text,
  },
  tabs: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
  },
});
