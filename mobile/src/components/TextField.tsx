import { TextInput, TextInputProps, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/colors";

export function TextField(props: TextInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: colors.text,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wrap: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
  },
});
