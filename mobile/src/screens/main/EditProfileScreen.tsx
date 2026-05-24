import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { getMe, updateMe, uploadAvatar } from "../../api/resources";
import { mediaUrl } from "../../config/api";
import { Loading } from "../../components/Loading";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/colors";
import { assetToUpload } from "../../utils/upload";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await getMe();
      const profile = response.user.profile;
      setUsername(profile.username);
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setAvatarUri(profile.avatar_url || null);
      setSelectedAvatar(null);
      setIsPrivate(profile.is_private);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow media library access to change profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images"] as ImagePicker.MediaType[],
      quality: 0.9,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedAvatar(asset);
      setAvatarUri(asset.uri);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateMe({
        username: username.trim(),
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        is_private: isPrivate,
      });

      if (selectedAvatar) {
        const form = new FormData();
        form.append("file", await assetToUpload(selectedAvatar, "avatar"));
        await uploadAvatar(form);
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <View style={styles.avatarBlock}>
          <Pressable onPress={pickAvatar} style={styles.avatarButton}>
            {avatarUri ? (
              <Image source={{ uri: selectedAvatar ? avatarUri : mediaUrl(avatarUri) }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{username.slice(0, 1).toUpperCase() || "?"}</Text>
            )}
          </Pressable>
          <Pressable onPress={pickAvatar}>
            <Text style={styles.avatarAction}>Change profile photo</Text>
          </Pressable>
        </View>
        <TextField value={username} onChangeText={setUsername} placeholder="Username" />
        <TextField value={fullName} onChangeText={setFullName} placeholder="Full name" />
        <TextField value={bio} onChangeText={setBio} placeholder="Bio" multiline />
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Private account</Text>
            <Text style={styles.switchBody}>Only accepted followers see posts and reels.</Text>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="Save" onPress={save} loading={saving} disabled={!username.trim()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  avatarBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderRadius: 48,
    borderWidth: 1,
    height: 96,
    justifyContent: "center",
    overflow: "hidden",
    width: 96,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarInitial: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
  },
  error: {
    color: colors.danger,
  },
  form: {
    gap: spacing.md,
  },
  switchBody: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  switchRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  switchTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
