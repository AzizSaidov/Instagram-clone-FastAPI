import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

function webStorage() {
  const storage = (globalThis as { localStorage?: Storage }).localStorage;

  if (!storage) {
    throw new Error("Browser storage is not available");
  }

  return storage;
}

export async function getTokenItem(key: string) {
  if (Platform.OS === "web") {
    return webStorage().getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setTokenItem(key: string, value: string) {
  if (Platform.OS === "web") {
    webStorage().setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteTokenItem(key: string) {
  if (Platform.OS === "web") {
    webStorage().removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
