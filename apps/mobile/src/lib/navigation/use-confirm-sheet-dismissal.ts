import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

import { confirmAction } from "@/lib/confirm-action";

interface ConfirmSheetDismissalOptions {
  blocked: boolean;
  canDiscard: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function useConfirmSheetDismissal({
  blocked,
  canDiscard,
  title,
  message,
  onClose
}: ConfirmSheetDismissalOptions) {
  const requestClose = useCallback(() => {
    if (!blocked) {
      onClose();
      return;
    }
    if (!canDiscard) return;

    confirmAction(title, message, "Discard", onClose);
  }, [blocked, canDiscard, message, onClose, title]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return undefined;

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        requestClose();
        return true;
      });

      return () => subscription.remove();
    }, [requestClose])
  );

  return requestClose;
}
