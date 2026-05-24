import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { createOrOpenChat, getChats, getMe } from "../../api/resources";
import type { Chat, CompactUser } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Chats">;

export function ChatsListScreen({ navigation }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [meResponse, chatsResponse] = await Promise.all([getMe(), getChats()]);
      setCurrentUserId(meResponse.user.id);
      setChats(chatsResponse.chats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function openByUsername() {
    const value = username.trim();
    if (!value) {
      return;
    }

    setOpening(true);
    setError(null);
    try {
      const response = await createOrOpenChat(value);
      const companion = getCompanion(response.chat, currentUserId);
      navigation.navigate("ChatDetail", { chatId: response.chat.id, username: companion.username });
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
    } finally {
      setOpening(false);
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
      <View style={styles.searchBox}>
        <TextField value={username} onChangeText={setUsername} placeholder="Open chat by username" />
        <PrimaryButton title="Open" onPress={openByUsername} loading={opening} disabled={!username.trim()} style={styles.openButton} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={chats}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyState title="No chats yet" body="Open a chat by username." />}
        renderItem={({ item }) => {
          const companion = getCompanion(item, currentUserId);
          return (
            <Pressable style={styles.chatRow} onPress={() => navigation.navigate("ChatDetail", { chatId: item.id, username: companion.username })}>
              <Avatar uri={companion.avatar_url} username={companion.username} size={52} />
              <View style={styles.chatBody}>
                <Text style={styles.chatUsername}>{companion.username}</Text>
                <Text numberOfLines={1} style={styles.lastMessage}>{item.last_message?.text || "Media message"}</Text>
              </View>
              <Text style={styles.date}>{new Date(item.updated_at).toLocaleDateString()}</Text>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

function getCompanion(chat: Chat, currentUserId: number | null): CompactUser {
  if (chat.user_1.id === currentUserId) {
    return chat.user_2;
  }
  return chat.user_1;
}

const styles = StyleSheet.create({
  chatBody: {
    flex: 1,
  },
  chatRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chatUsername: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  date: {
    color: colors.muted,
    fontSize: 11,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.md,
  },
  lastMessage: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  openButton: {
    width: 86,
  },
  searchBox: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
});
