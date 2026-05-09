import type { TransactionType } from "@shared/types";
import { useBillingSessionStore } from "./billingSessionStore";
import { useBillingTabsStore } from "./billingTabsStore";

export const billingCoordinator = {
  addTab(type: TransactionType, routePath: string, transactionNo: number | null = null) {
    const newTab = useBillingTabsStore.getState().addTab(type, routePath, transactionNo, false);
    if (!newTab) return null;

    const sessionStore = useBillingSessionStore.getState();
    sessionStore.initSession(newTab.id);
    sessionStore.updateField(newTab.id, "billingType", type);

    return newTab;
  },

  removeTab(tabId: string) {
    useBillingSessionStore.getState().removeSession(tabId);
    return useBillingTabsStore.getState().removeTab(tabId);
  }
};
