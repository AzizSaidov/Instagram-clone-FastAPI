import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();
  const [login, setLogin] = useState(route.params?.registeredLogin || "");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(route.params?.registeredLogin ? "Account created. Log in to continue." : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (route.params?.registeredLogin) {
      setLogin(route.params.registeredLogin);
      setNotice("Account created. Log in to continue.");
    }
  }, [route.params?.registeredLogin]);

  async function handleLogin() {
    setError(null);
    setNotice("");
    setSubmitting(true);
    try {
      await signIn(login.trim(), password);
    } catch (err) {
      setError(cleanError(err, "Could not log in. Check username/phone and password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll noPadding contentContainerStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.main}>
          <Text style={styles.logo}>InstaFast</Text>

          <View style={styles.form}>
            <TextField value={login} onChangeText={setLogin} placeholder="Phone number, username" textContentType="username" />
            <TextField value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry textContentType="password" />
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton title="Log in" onPress={handleLogin} loading={submitting} disabled={!login.trim() || !password} />
            <Pressable style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomBox}>
          <Text style={styles.bottomText}>Don't have an account?</Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}> Sign up.</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function cleanError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && !error.message.includes("SecureStore")) {
    return error.message;
  }

  return fallback;
}

const styles = StyleSheet.create({
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
  forgot: {
    alignItems: "center",
    minHeight: 36,
    justifyContent: "center",
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  form: {
    gap: spacing.sm,
    marginTop: 34,
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
  logo: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
  },
  main: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  notice: {
    color: colors.success,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  screen: {
    flexGrow: 1,
  },
});
