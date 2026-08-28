import type { TransactionType } from "@shared/types";
import { billingSyncCoordinator } from "../syncWorker";
import { useBillingSessionStore } from "./billingSession.store";
import { useBillingTabsStore } from "./billingTabs.store";

export const billingCoordinator = {
  addTab(type: TransactionType, routePath: string, transactionNo: number | null = null) {
    const newTab = useBillingTabsStore.getState().addTab(type, routePath, transactionNo, false);
    if (!newTab) return null;

    const sessionStore = useBillingSessionStore.getState();
    sessionStore.initSession(newTab.id);
    sessionStore.updateUiField(newTab.id, "billingType", type);

    return newTab;
  },

  removeTab(tabId: string, options: { discard?: boolean } = {}) {
    billingSyncCoordinator.cancel(tabId, options);
    useBillingSessionStore.getState().removeSession(tabId);
    return useBillingTabsStore.getState().removeTab(tabId);
  },

  removeAllTabs(options: { discard?: boolean } = {}) {
    billingSyncCoordinator.cancelAll(options);
    useBillingSessionStore.setState({ sessions: {} });
    useBillingTabsStore.getState().reset();
  },

  async flushAndRemoveTab(tabId: string) {
    await billingSyncCoordinator.flush(tabId);
    return this.removeTab(tabId);
  }
};
