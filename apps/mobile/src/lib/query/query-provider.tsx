import { QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { useEffect, type PropsWithChildren } from "react";
import { AppState, Platform } from "react-native";

import { queryClient } from "./query-client";

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const appState = AppState.addEventListener("change", (status) => {
      if (Platform.OS !== "web") focusManager.setFocused(status === "active");
    });
    const network = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(Boolean(state.isConnected));
    });

    return () => {
      appState.remove();
      network.remove();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
