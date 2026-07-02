import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useCallback } from "react";

export function useActiveTabId() {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);

  const getActiveTabId = useCallback(() => useBillingTabsStore.getState().activeTabId, []);

  return { activeTabId, getActiveTabId };
}
