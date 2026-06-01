import { apiClient } from "@/lib/apiClient";
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

  const { updateTab } = useBillingTabsStore.getState();
  const sessionStore = useBillingSessionStore.getState();
  const session = sessionStore.sessions[tabId];
  if (!session) return;

  const { lineItems } = session;
  const { markItemAsSaving, markItemAsSynced, updateLineItemId, purgeDeletedItems, updateField } =
    sessionStore;
  const { billingId, billingType, transactionNo, customerId, billingDate, isMetaDataDirty } =
    session;

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  if (dirtyItems.length === 0 && !isMetaDataDirty) return;

  syncStates.set(tabId, true);
  updateField(tabId, "status", BILLSTATUS.SAVING);
  markItemAsSaving(tabId, dirtyItems);

  const normalizedItems = normalizeLineItems(dirtyItems); // here strip of the sync status
  const payload = buildTransactionPayload({
    billingType,
    transactionNo,
    customerId,
    items: normalizedItems,
    createdAt: billingDate ? billingDate.toISOString() : new Date().toISOString()
  });

  const isNewBill = !billingId;
  const endpoint = isNewBill
    ? `/api/${billingType}s/create`
    : `/api/${billingType}s/${billingId}/sync`;

  try {
    const response = (await apiClient.post(endpoint, payload)) as SyncResponse;

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
    console.error("Sync error:", error);
    updateField(tabId, "status", BILLSTATUS.ERROR);
  } finally {
    syncStates.set(tabId, false);
    updateField(tabId, "status", BILLSTATUS.SAVED);

    const freshSession = useBillingSessionStore.getState().sessions[tabId];
    const freshValid = filterValidLineItems(freshSession?.lineItems ?? []);
    const pendingItems = filterDirtyLineItems(freshValid);

    if (pendingItems.length > 0) {
      processSyncQueue(tabId);
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

// get isSyncing state - in-flight
export const isSyncing = (tabId: string): boolean => {
  return syncStates.get(tabId) === true;
};

// wait until all changes are fully synced
// resolves when tab is fully synced
export const flushSync = (tabId: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const TIMEOUT_MS = 10_000;
    const POLL_INTERVAL_MS = 100;
    const start = Date.now();

    const poll = () => {
      if (Date.now() - start > TIMEOUT_MS) {
        reject(new Error("Timed out"));
        return;
      }

      // still syncing — wait for it to finish
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

      // pending items exist but sync has not picked them yet — keep waiting
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
  });
};
