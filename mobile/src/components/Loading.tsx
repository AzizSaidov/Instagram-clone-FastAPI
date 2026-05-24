import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/colors";

export function Loading() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
  },
});
