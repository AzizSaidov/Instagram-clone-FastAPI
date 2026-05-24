import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/resources";
import type { NotificationItem } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

export function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await getNotifications();
      setItems(response.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function openNotification(item: NotificationItem) {
    markNotificationRead(item.id).catch(() => undefined);
    setItems((current) => current.map((notification) => (notification.id === item.id ? { ...notification, is_read: true } : notification)));

    if (item.post_id) {
      navigation.navigate("PostDetail", { postId: item.post_id });
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark all as read");
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
      <View style={styles.toolbar}>
        <PrimaryButton title="Mark all read" variant="secondary" onPress={readAll} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyState title="No notifications" body="Likes, comments and follows appear here." />}
        renderItem={({ item }) => (
          <Pressable style={[styles.row, !item.is_read && styles.unread]} onPress={() => openNotification(item)}>
            <Avatar uri={item.from_user.avatar_url} username={item.from_user.username} size={44} />
            <View style={styles.body}>
              <Text style={styles.text}>
                <Text style={styles.username}>{item.from_user.username}</Text> {messageFor(item)}
              </Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function messageFor(item: NotificationItem) {
  if (item.type === "like") {
    return "liked your content.";
  }
  if (item.type === "comment") {
    return "commented on your content.";
  }
  if (item.type === "follow_request") {
    return "sent a follow request.";
  }
  if (item.type === "follow") {
    return "started following you.";
  }
  return `sent ${item.type}.`;
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.text,
    lineHeight: 20,
  },
  toolbar: {
    alignItems: "flex-end",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: spacing.md,
  },
  unread: {
    backgroundColor: "#eef7ff",
  },
  username: {
    fontWeight: "800",
  },
});
