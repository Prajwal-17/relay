import * as Network from "expo-network";

export function useNetworkStatus() {
  const state = Network.useNetworkState();
  const isOffline = state.isConnected === false || state.isInternetReachable === false;

  return {
    isOffline,
    isKnown: state.isConnected !== undefined,
    state
  };
}
