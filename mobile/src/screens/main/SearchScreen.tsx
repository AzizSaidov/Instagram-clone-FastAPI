import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { searchProfiles } from "../../api/resources";
import type { Profile } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { colors, spacing } from "../../theme/colors";

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchProfiles(normalized);
        setResults(response.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Screen noPadding>
      <View style={styles.searchBar}>
        <TextField value={query} onChangeText={setQuery} placeholder="Search username" autoCorrect={false} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <EmptyState
            title={loading ? "Searching..." : "Find profiles"}
            body={query.trim().length < 2 ? "Search is intentionally username-only." : "No matching usernames."}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.navigate("PublicProfile", { username: item.username })}>
            <Avatar uri={item.avatar_url} username={item.username} size={48} />
            <View style={styles.rowText}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.fullName}>{item.full_name || "No full name"}</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.md,
  },
  fullName: {
    color: colors.muted,
    fontSize: 13,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  searchBar: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: spacing.md,
  },
  username: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
