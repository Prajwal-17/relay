import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

void WebBrowser.maybeCompleteAuthSession();

export const serverUrl = (process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:8787").replace(
  /\/$/,
  ""
);

export const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [
    expoClient({
      scheme: "relay",
      storagePrefix: "relay",
      storage: SecureStore
    })
  ]
});
