import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export async function assetToUpload(asset: ImagePicker.ImagePickerAsset, fallbackName: string) {
  const extension = asset.uri.split(".").pop() || (asset.type === "video" ? "mp4" : "jpg");
  const name = asset.fileName || `${fallbackName}.${extension}`;
  const type = asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg");

  if (Platform.OS === "web") {
    const webAsset = asset as ImagePicker.ImagePickerAsset & { file?: File };

    if (webAsset.file) {
      return webAsset.file;
    }

    const response = await fetch(asset.uri);
    const blob = await response.blob();

    if (typeof File !== "undefined") {
      return new File([blob], name, { type });
    }

    return blob as Blob;
  }

  return {
    uri: asset.uri,
    name,
    type,
  } as unknown as Blob;
}

export function normalizeHashtagForCreate(value: string) {
  const text = value.trim().toLowerCase();

  return text.startsWith("#") ? text : `#${text}`;
}
