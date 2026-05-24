import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
};

export function IconButton({ name, onPress, color = colors.text, size = 24 }: IconButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name={name} color={color} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pressed: {
    opacity: 0.55,
  },
});
