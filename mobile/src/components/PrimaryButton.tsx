import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, spacing } from "../theme/colors";

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, loading = false, disabled = false, variant = "primary", style }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "secondary" ? colors.text : "#ffffff"} /> : <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  secondaryText: {
    color: colors.text,
  },
  text: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
