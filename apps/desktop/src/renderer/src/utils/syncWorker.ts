import { apiClient, ApiError } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import {
  buildTransactionPayload,
  filterDirtyLineItems,
  filterValidLineItems,
  normalizeLineItems
} from "@/utils";
import { BILLSTATUS, type SyncResponse } from "@shared/types";
import debounce from "lodash.debounce";

const syncStates = new Map<string, boolean>();
const syncQueues = new Map<string, ReturnType<typeof debounce>>();

const syncLogic = async (tabId: string) => {
  if (syncStates.get(tabId)) return;

  // lock first - to prevent items dropped in between
  syncStates.set(tabId, true);

  const { updateTab } = useBillingTabsStore.getState();
  const sessionStore = useBillingSessionStore.getState();
  const session = sessionStore.sessions[tabId];

  if (!session) {
    syncStates.set(tabId, false);
    return;
  }

  const { lineItems } = session;
  const {
    markItemAsSaving,
    markItemAsSynced,
    updateLineItemId,
    purgeDeletedItems,
    updateField,
    revertItemToDirty
  } = sessionStore;
  const { billingType, transactionNo, customerId, billingDate, isMetaDataDirty } = session;

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  if (dirtyItems.length === 0 && !isMetaDataDirty) {
    syncStates.set(tabId, false);
    return;
  }

  markItemAsSaving(tabId, dirtyItems);
  updateField(tabId, "status", BILLSTATUS.SAVING);

  const normalizedItems = normalizeLineItems(dirtyItems); // here strip of the sync status
  const payload = buildTransactionPayload({
    billingType,
    transactionNo,
    customerId,
    items: normalizedItems,
    createdAt: billingDate ? billingDate.toISOString() : new Date().toISOString()
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const currentBillingId = useBillingSessionStore.getState().sessions[tabId]?.billingId;
    const isNewBill = !currentBillingId;
    const endpoint = isNewBill
      ? `/api/${billingType}s/create`
      : `/api/${billingType}s/${currentBillingId}/sync`;

    const response = (await apiClient.post(endpoint, payload, {
      signal: controller.signal
    })) as SyncResponse;

    if (isNewBill && response.billingId) {
      updateField(tabId, "billingId", response.billingId);
      if (response.transactionNo !== null && response.transactionNo !== undefined) {
        updateField(tabId, "transactionNo", response.transactionNo);
      }
      updateTab(tabId, {
        routePath: `/billing/${billingType}s/${response.billingId}/edit`,
        transactionNo: response.transactionNo
      });
    }

    const updateIdsMap: Map<string, string> = new Map(
      response.syncedItems.map((i) => [i.rowId, i.id])
    );
    const syncIds: Set<string> = new Set(response.syncedItems.map((i) => i.rowId));
    const purgeIds: Set<string> = new Set(response.deletedRowIds);

    updateLineItemId(tabId, updateIdsMap);
    markItemAsSynced(tabId, syncIds);
    purgeDeletedItems(tabId, purgeIds);
    updateField(tabId, "isMetaDataDirty", false);
  } catch (error) {
    revertItemToDirty(tabId, dirtyItems);

    const isNonRetryable = error instanceof ApiError && error.status >= 400 && error.status < 500;

    if (isNonRetryable) {
      console.error("Sync validation error:", error.message);
      updateField(tabId, "status", BILLSTATUS.ERROR);
    } else {
      console.error("Sync error:", error);
      updateField(tabId, "status", BILLSTATUS.ERROR);
    }
  } finally {
    clearTimeout(timeout);
    syncStates.set(tabId, false);

    const freshSession = useBillingSessionStore.getState().sessions[tabId];
    if (freshSession) {
      updateField(tabId, "status", BILLSTATUS.SAVED);

      const freshValid = filterValidLineItems(freshSession.lineItems);
      const pendingItems = filterDirtyLineItems(freshValid);

      if (pendingItems.length > 0) {
        processSyncQueue(tabId);
      }
    }
  }
};

export const processSyncQueue = (tabId: string) => {
  if (!syncQueues.has(tabId)) {
    syncQueues.set(
      tabId,
      debounce((id: string) => syncLogic(id), 800)
    );
  }
  const fn = syncQueues.get(tabId)!;
  fn(tabId);
};

export const cancelSyncQueue = (tabId: string) => {
  const fn = syncQueues.get(tabId);
  if (fn) {
    fn.cancel();
  }
  syncQueues.delete(tabId);
  syncStates.delete(tabId);
};

export const forceSync = (tabId: string) => {
  const fn = syncQueues.get(tabId);
  if (fn) {
    fn.flush(); // .flush is func from loadash.debounce - cancel the timer & executes
  }
};

// get isSyncing state - in-flight
export const isSyncing = (tabId: string): boolean => {
  return syncStates.get(tabId) === true;
};

/**
 * Polls every 100ms until cond. are met
 * Basically used when close billing page
 * returns a promise resolves only when
 * - no sync is in flight
 * - no dirty items
 */
export const flushSync = (tabId: string): Promise<void> => {
  forceSync(tabId);

  return new Promise<void>((resolve, reject) => {
    const TIMEOUT_MS = 10_000;
    const POLL_INTERVAL_MS = 100;
    const start = Date.now();

    const poll = () => {
      if (Date.now() - start > TIMEOUT_MS) {
        reject(new Error("Timed out"));
        return;
      }

      if (syncStates.get(tabId)) {
        setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      const session = useBillingSessionStore.getState().sessions[tabId];
      if (!session) {
        resolve();
        return;
      }
      const validItems = filterValidLineItems(session.lineItems);
      const dirtyItems = filterDirtyLineItems(validItems);
      const hasPending = dirtyItems.length > 0;

      if (!hasPending) {
        resolve();
        return;
      }

      processSyncQueue(tabId);
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
  });
};
