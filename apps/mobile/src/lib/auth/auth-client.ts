import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

void WebBrowser.maybeCompleteAuthSession();

const configuredScheme = Constants.expoConfig?.scheme;
const scheme = Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme;

const isDevelopment = __DEV__ || scheme === "relay-dev";

export const serverUrl = (
  isDevelopment
    ? process.env.EXPO_PUBLIC_SERVER_URL?.trim() || "https://relay-dev-tunnel.prajwal.sh"
    : "https://relay-server.prajwal.sh"
).replace(/\/+$/, "");

export const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [
    expoClient({
      scheme: scheme ?? "relay",
      storagePrefix: "relay",
      storage: SecureStore
    })
  ]
});
