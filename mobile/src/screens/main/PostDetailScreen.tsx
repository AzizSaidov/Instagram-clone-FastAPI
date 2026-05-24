import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { addPostComment, createPostView, createStoryFromPost, getPost, getPostComments, togglePostLike } from "../../api/resources";
import type { Comment, Post } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { PostCard } from "../../components/PostCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "PostDetail">;

export function PostDetailScreen({ route }: Props) {
  const { postId, authorUsername: routeAuthorUsername } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [authorUsername, setAuthorUsername] = useState(routeAuthorUsername);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [postResponse, commentsResponse] = await Promise.all([getPost(postId), getPostComments(postId)]);
      setPost(postResponse.post);
      setComments(commentsResponse.comments);
      setAuthorUsername(postResponse.post.user?.username || routeAuthorUsername);

      createPostView(postId).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load post");
    } finally {
      setLoading(false);
    }
  }, [postId, routeAuthorUsername]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function sendComment() {
    const value = text.trim();
    if (!value) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const response = await addPostComment(postId, value);
      setComments((items) => [response.comment, ...items]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add comment");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {post ? (
                <PostCard
                  post={post}
                  authorUsername={authorUsername}
                  onLike={() => togglePostLike(post.id).catch(() => undefined)}
                  onShareToStory={() => createStoryFromPost(post.id).catch((err) => setError(err instanceof Error ? err.message : "Could not share"))}
                />
              ) : null}
              <Text style={styles.commentsTitle}>Comments</Text>
            </>
          }
          ListEmptyComponent={<EmptyState title="No comments yet" body="Start the conversation." />}
          renderItem={({ item }) => <CommentRow comment={item} />}
        />

        <View style={styles.inputBar}>
          <TextField value={text} onChangeText={setText} placeholder="Add a comment..." style={styles.input} />
          <PrimaryButton title="Post" onPress={sendComment} loading={sending} disabled={!text.trim()} style={styles.sendButton} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <Pressable style={styles.comment}>
      <Avatar uri={comment.user.avatar_url} username={comment.user.username} size={36} />
      <View style={styles.commentBody}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUser}>{comment.user.username} </Text>
          {comment.text}
        </Text>
        <Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleString()}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  comment: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentBody: {
    flex: 1,
  },
  commentDate: {
    color: colors.muted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  commentText: {
    color: colors.text,
    lineHeight: 20,
  },
  commentUser: {
    fontWeight: "800",
  },
  commentsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    padding: spacing.md,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
  input: {
    flex: 1,
  },
  inputBar: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sendButton: {
    width: 82,
  },
  wrap: {
    flex: 1,
  },
});
