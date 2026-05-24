import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { createPost, createReel, createStory } from "../../api/resources";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { colors, spacing } from "../../theme/colors";
import { assetToUpload, normalizeHashtagForCreate } from "../../utils/upload";

type CreateMode = "post" | "reel" | "story";

export function CreateScreen({ route }: any) {
  const initialMode = route.params?.mode as CreateMode | undefined;
  const [mode, setMode] = useState<CreateMode>(initialMode || "post");
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [description, setDescription] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = assets.length > 0 && (mode !== "reel" || assets[0]?.type === "video");

  const pickerTypes = useMemo(() => (mode === "reel" ? ["videos"] : ["images", "videos"]), [mode]);

  async function pickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow media library access to upload content.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: mode === "post",
      mediaTypes: pickerTypes as ImagePicker.MediaType[],
      quality: 0.9,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
    });

    if (!result.canceled) {
      setAssets(mode === "post" ? result.assets.slice(0, 10) : result.assets.slice(0, 1));
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const form = new FormData();

      if (mode !== "story") {
        if (description.trim()) {
          form.append("description", description.trim());
        }

        if (hashtag.trim()) {
          form.append("hashtag", normalizeHashtagForCreate(hashtag));
        }
      }

      if (mode === "post") {
        for (const [index, asset] of assets.entries()) {
          form.append("files", await assetToUpload(asset, `post-${index}`));
        }
        await createPost(form);
      }

      if (mode === "reel") {
        form.append("file", await assetToUpload(assets[0], "reel"));
        await createReel(form);
      }

      if (mode === "story") {
        form.append("file", await assetToUpload(assets[0], "story"));
        await createStory(form);
      }

      setAssets([]);
      setDescription("");
      setHashtag("");
      Alert.alert("Uploaded", `${mode} was created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.segment}>
        {(["post", "reel", "story"] as CreateMode[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setMode(item);
              setAssets([]);
            }}
            style={[styles.segmentItem, mode === item && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{item.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton title={assets.length ? "Change media" : "Pick media"} variant="secondary" onPress={pickMedia} />

      {assets.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>
          {assets.map((asset) => (
            <Image key={asset.assetId || asset.uri} source={{ uri: asset.uri }} style={styles.preview} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyText}>Select {mode === "reel" ? "one mp4 video" : "photo or video"} from the device.</Text>
        </View>
      )}

      {mode !== "story" ? (
        <View style={styles.form}>
          <TextField value={description} onChangeText={setDescription} placeholder="Description" multiline />
          <TextField value={hashtag} onChangeText={setHashtag} placeholder="#hashtag" />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title={`Create ${mode}`} onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyPreview: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginVertical: spacing.md,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.muted,
    lineHeight: 20,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    height: 220,
    marginRight: spacing.sm,
    width: 220,
  },
  previewRow: {
    marginVertical: spacing.md,
  },
  segment: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: 3,
  },
  segmentActive: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  segmentItem: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: colors.text,
  },
});
