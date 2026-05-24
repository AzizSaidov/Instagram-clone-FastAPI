import { ReactNode } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../theme/colors";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = false, noPadding = false, style, contentContainerStyle }: ScreenProps) {
  const paddingStyle = noPadding ? undefined : styles.padding;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={["left", "right"]}>
        <ScrollView contentContainerStyle={[paddingStyle, contentContainerStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={[styles.safe, paddingStyle, style]} edges={["left", "right"]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  padding: {
    padding: spacing.md,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
