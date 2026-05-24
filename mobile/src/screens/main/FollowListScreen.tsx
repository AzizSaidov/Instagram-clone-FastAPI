import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { getFollowers, getFollowing } from "../../api/resources";
import type { FollowProfile } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { Screen } from "../../components/Screen";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "FollowList">;

export function FollowListScreen({ route, navigation }: Props) {
  const { username, type } = route.params;
  const [users, setUsers] = useState<FollowProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = type === "followers" ? await getFollowers(username) : await getFollowing(username);
      setUsers(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, username]);

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

  return (
    <Screen noPadding>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title={type === "followers" ? "No followers yet" : "No following yet"} />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.navigate("PublicProfile", { username: item.username })}>
            <Avatar uri={item.avatar_url} username={item.username} size={50} />
            <View style={styles.copy}>
              <Text style={styles.username}>{item.username}</Text>
              {item.full_name && item.full_name.trim().toLowerCase() !== item.username.trim().toLowerCase() ? (
                <Text numberOfLines={1} style={styles.fullName}>{item.full_name}</Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
  fullName: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  username: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
});
