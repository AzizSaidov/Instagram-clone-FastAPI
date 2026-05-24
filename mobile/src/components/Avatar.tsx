import { Image, StyleSheet, Text, View } from "react-native";

import { mediaUrl } from "../config/api";
import { colors } from "../theme/colors";

type AvatarProps = {
  uri?: string | null;
  username?: string | null;
  size?: number;
  story?: boolean;
};

export function Avatar({ uri, username, size = 44, story = false }: AvatarProps) {
  const image = mediaUrl(uri);
  const initials = (username || "?").slice(0, 1).toUpperCase();

  return (
    <View
      style={[
        styles.wrap,
        story && styles.storyRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: "100%", height: "100%", borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.max(13, size / 3) }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initials: {
    color: colors.text,
    fontWeight: "700",
  },
  storyRing: {
    borderColor: colors.storyCool,
    borderWidth: 2,
    padding: 2,
  },
  wrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
});
