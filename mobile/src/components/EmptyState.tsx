import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../theme/colors";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
});
