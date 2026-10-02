import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

void WebBrowser.maybeCompleteAuthSession();

const configuredScheme = Constants.expoConfig?.scheme;
const scheme = Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme;

export const serverUrl = (process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:8787").replace(
  /\/$/,
  ""
);

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
