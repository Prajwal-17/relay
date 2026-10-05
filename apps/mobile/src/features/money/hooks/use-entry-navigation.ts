import { useRouter, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useRef, type RefObject } from "react";

import { confirmAction } from "@/lib/confirm-action";
import type { LocalDate } from "../money.types";

export function useEntryNavigation(date: LocalDate) {
  const router = useRouter();
  const finished = useRef(false);
  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/money", params: { date } });
  }, [date, router]);
  const finish = useCallback(() => {
    finished.current = true;
    leave();
  }, [leave]);
  return { finish, finished };
}

/** Covers system Back and stack gestures as well as the screen's Back control. */
export function useEntryRemovalGuard(
  entry: { dirty: boolean; saving: boolean; committed: boolean; editing?: boolean },
  finished: RefObject<boolean>
) {
  const navigation = useNavigation();
  usePreventRemove(entry.dirty || entry.saving, ({ data }) => {
    if (finished.current || (entry.committed && !entry.saving)) {
      navigation.dispatch(data.action);
    } else if (!entry.saving) {
      confirmAction(
        entry.editing ? "Discard changes?" : "Discard this entry?",
        entry.editing
          ? "Your changes have not been saved."
          : "This entry has not been added to Money.",
        "Discard",
        () => navigation.dispatch(data.action)
      );
    }
  });
}
