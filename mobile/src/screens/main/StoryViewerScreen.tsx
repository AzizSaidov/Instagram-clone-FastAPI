import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { createStoryView, getPost, getStory } from "../../api/resources";
import type { Post, Story } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { mediaUrl } from "../../config/api";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "StoryViewer">;

export function StoryViewerScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const [story, setStory] = useState<Story | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await getStory(storyId);
      setStory(response.story);
      createStoryView(storyId).catch(() => undefined);

      if (response.story.post_id) {
        const postResponse = await getPost(response.story.post_id);
        setPost(postResponse.post);
      } else {
        setPost(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open story");
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <Screen noPadding style={styles.screen}>
        <Loading />
      </Screen>
    );
  }

  const image = story?.media_url || post?.media[0]?.media_url;

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.progress} />
        <View style={styles.authorRow}>
          <Avatar uri={story?.user.avatar_url} username={story?.user.username} size={34} story />
          <Text style={styles.author}>{story?.user.username || "story"}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.mediaWrap}>
        {image ? (
          <Image source={{ uri: mediaUrl(image) }} style={styles.media} resizeMode="contain" />
        ) : (
          <Text style={styles.emptyText}>Story media is not available.</Text>
        )}
      </View>

      {post ? (
        <View style={styles.postAction}>
          <PrimaryButton
            title="View post"
            onPress={() => navigation.navigate("PostDetail", { postId: post.id, authorUsername: post.user?.username })}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  author: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  closeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.md,
  },
  media: {
    height: "100%",
    width: "100%",
  },
  mediaWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  postAction: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  progress: {
    backgroundColor: colors.text,
    borderRadius: 2,
    height: 3,
    marginBottom: spacing.md,
  },
  screen: {
    backgroundColor: "#000000",
  },
  top: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
});
