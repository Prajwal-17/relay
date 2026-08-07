import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useCallback } from "react";

export function useActiveTabId() {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);

  const getActiveTabId = useCallback(() => useBillingTabsStore.getState().activeTabId, []);

  return { activeTabId, getActiveTabId };
}
