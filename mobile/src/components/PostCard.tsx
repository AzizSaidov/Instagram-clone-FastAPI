import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { Post } from "../api/types";
import { mediaUrl } from "../config/api";
import { colors, spacing } from "../theme/colors";
import { formatHashtag } from "../utils/format";
import { Avatar } from "./Avatar";
import { IconButton } from "./IconButton";

type PostCardProps = {
  post: Post;
  authorUsername?: string;
  onOpen?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShareToStory?: () => void;
};

export function PostCard({ post, authorUsername, onOpen, onLike, onComment, onShareToStory }: PostCardProps) {
  const { width } = useWindowDimensions();
  const mediaSize = Math.min(width, 430);
  const username = post.user?.username || authorUsername || "unknown";
  const hashtag = formatHashtag(post.hashtag);

  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} style={styles.header}>
        <Avatar uri={post.user?.avatar_url} username={username} size={34} />
        <View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.meta}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
      </Pressable>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {post.media.map((item) => (
          <Pressable key={item.id} onPress={onOpen}>
            <Image source={{ uri: mediaUrl(item.media_url) }} style={[styles.media, { width: mediaSize, height: mediaSize }]} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <View style={styles.actionLeft}>
          <IconButton name="heart-outline" onPress={onLike} />
          <IconButton name="chatbubble-outline" onPress={onComment || onOpen} />
          <IconButton name="paper-plane-outline" onPress={onShareToStory} />
        </View>
        <View style={styles.views}>
          <Ionicons name="eye-outline" size={16} color={colors.muted} />
          <Text style={styles.viewsText}>{post.views_count}</Text>
        </View>
      </View>

      <Pressable onPress={onOpen} style={styles.caption}>
        {post.description ? <Text style={styles.description}>{post.description}</Text> : null}
        {hashtag ? <Text style={styles.hashtag}>{hashtag}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionLeft: {
    flexDirection: "row",
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  caption: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  hashtag: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  media: {
    backgroundColor: colors.elevated,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  username: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  views: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  viewsText: {
    color: colors.muted,
    fontSize: 12,
  },
});
