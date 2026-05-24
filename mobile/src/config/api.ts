import { Platform } from "react-native";

const envApiUrl = process.env?.EXPO_PUBLIC_API_URL;

const fallbackApiUrl = Platform.select({
  android: "http://10.0.2.2:8000",
  ios: "http://127.0.0.1:8000",
  web: "http://127.0.0.1:8000",
  default: "http://127.0.0.1:8000",
});

export const API_BASE_URL = (envApiUrl || fallbackApiUrl || "http://127.0.0.1:8000").replace(/\/$/, "");

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

export function mediaUrl(path?: string | null) {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
