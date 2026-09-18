import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/build/react-navigation/core";
import { useEffect, useRef, useState } from "react";

import { confirmAction } from "@/lib/confirm-action";

interface ConfirmSheetDismissalOptions {
  blocked: boolean;
  canDiscard: boolean;
  title: string;
  message: string;
}

export function useConfirmSheetDismissal({
  blocked,
  canDiscard,
  title,
  message
}: ConfirmSheetDismissalOptions) {
  const navigation = useNavigation();
  const pendingRemoval = useRef<(() => void) | null>(null);
  const [removalAllowed, setRemovalAllowed] = useState(false);
  const shouldPreventRemove = blocked && !removalAllowed;

  usePreventRemove(shouldPreventRemove, ({ data }) => {
    if (!canDiscard) return;

    confirmAction(title, message, "Discard", () => {
      pendingRemoval.current = () => navigation.dispatch(data.action);
      setRemovalAllowed(true);
    });
  });

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !shouldPreventRemove,
      headerBackButtonMenuEnabled: false
    });
  }, [navigation, shouldPreventRemove]);

  useEffect(() => {
    if (!removalAllowed) return;

    const remove = pendingRemoval.current;
    pendingRemoval.current = null;
    remove?.();
  }, [removalAllowed]);
}
