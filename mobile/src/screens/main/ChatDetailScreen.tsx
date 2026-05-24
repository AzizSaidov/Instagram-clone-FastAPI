import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { getChatMessages, getMe, markChatRead, sendMessage } from "../../api/resources";
import type { DirectMessage } from "../../api/types";
import { mediaUrl } from "../../config/api";
import { EmptyState } from "../../components/EmptyState";
import { IconButton } from "../../components/IconButton";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "ChatDetail">;

export function ChatDetailScreen({ route }: Props) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [meResponse, messagesResponse] = await Promise.all([getMe(), getChatMessages(chatId)]);
      setCurrentUserId(meResponse.user.id);
      setMessages(messagesResponse.messages);
      markChatRead(chatId).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function pickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images", "videos"] as ImagePicker.MediaType[],
      quality: 0.9,
    });

    if (!result.canceled) {
      setAsset(result.assets[0]);
    }
  }

  async function handleSend() {
    if (!text.trim() && !asset) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      if (text.trim()) {
        form.append("text", text.trim());
      }
      if (asset) {
        form.append("file", assetToFile(asset));
      }
      await sendMessage(chatId, form);
      setText("");
      setAsset(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={<EmptyState title="No messages" body="Send the first direct message." />}
          renderItem={({ item }) => <MessageBubble message={item} isMine={item.sender.id === currentUserId} />}
        />
        {asset ? (
          <Pressable style={styles.attachment} onPress={() => setAsset(null)}>
            <Image source={{ uri: asset.uri }} style={styles.attachmentImage} />
            <Text style={styles.attachmentText}>Tap to remove attachment</Text>
          </Pressable>
        ) : null}
        <View style={styles.inputBar}>
          <IconButton name="image-outline" onPress={pickMedia} />
          <TextField value={text} onChangeText={setText} placeholder="Message..." style={styles.input} />
          <PrimaryButton title="Send" onPress={handleSend} loading={sending} disabled={!text.trim() && !asset} style={styles.sendButton} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function MessageBubble({ message, isMine }: { message: DirectMessage; isMine: boolean }) {
  return (
    <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
      {message.media_url ? <Image source={{ uri: mediaUrl(message.media_url) }} style={styles.messageImage} /> : null}
      {message.text ? <Text style={[styles.messageText, isMine && styles.mineText]}>{message.text}</Text> : null}
      <Text style={[styles.messageDate, isMine && styles.mineDate]}>{new Date(message.created_at).toLocaleTimeString()}</Text>
    </View>
  );
}

function assetToFile(asset: ImagePicker.ImagePickerAsset) {
  const extension = asset.uri.split(".").pop() || (asset.type === "video" ? "mp4" : "jpg");
  return {
    uri: asset.uri,
    name: asset.fileName || `message.${extension}`,
    type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
  } as unknown as Blob;
}

const styles = StyleSheet.create({
  attachment: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  attachmentImage: {
    borderRadius: 6,
    height: 48,
    width: 48,
  },
  attachmentText: {
    color: colors.muted,
    fontSize: 12,
  },
  bubble: {
    borderRadius: 16,
    marginVertical: spacing.xs,
    maxWidth: "78%",
    padding: spacing.sm,
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
    gap: spacing.xs,
    padding: spacing.sm,
  },
  messageDate: {
    color: colors.muted,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  messageImage: {
    borderRadius: 12,
    height: 180,
    marginBottom: spacing.xs,
    width: 180,
  },
  messageList: {
    padding: spacing.md,
  },
  messageText: {
    color: colors.text,
    lineHeight: 20,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  mineDate: {
    color: "rgba(255,255,255,0.78)",
  },
  mineText: {
    color: colors.background,
  },
  sendButton: {
    width: 82,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
  },
  wrap: {
    flex: 1,
  },
});
