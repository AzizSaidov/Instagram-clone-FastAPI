import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    setError(null);
    setSubmitting(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      await signUp({
        phone_number: phone.trim(),
        username: cleanUsername,
        password,
      });
      navigation.navigate("Login", { registeredLogin: cleanUsername });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll noPadding contentContainerStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up to share photos, reels and messages with friends.</Text>

          <View style={styles.form}>
            <TextField value={phone} onChangeText={setPhone} placeholder="Mobile number, starts with +" keyboardType="phone-pad" textContentType="telephoneNumber" />
            <TextField value={username} onChangeText={setUsername} placeholder="Username" textContentType="username" />
            <TextField value={password} onChangeText={setPassword} placeholder="Password, 8+ characters" secureTextEntry textContentType="newPassword" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton title="Sign up" onPress={handleRegister} loading={submitting} disabled={!phone.trim() || !username.trim() || password.length < 8} />
          </View>
        </View>

        <View style={styles.bottomBox}>
          <Text style={styles.bottomText}>Have an account?</Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}> Log in.</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  bottomBox: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 70,
    paddingHorizontal: spacing.md,
  },
  bottomText: {
    color: colors.muted,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  form: {
    gap: spacing.sm,
    marginTop: 24,
    width: "100%",
  },
  keyboard: {
    flex: 1,
    minHeight: 560,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  main: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  screen: {
    flexGrow: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 300,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  topBar: {
    height: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
});
