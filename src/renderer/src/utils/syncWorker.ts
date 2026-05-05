import { apiClient } from "@/lib/apiClient";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useBillingSessionStore } from "@/store/billing/useBillingSessionStore";
import {
  buildTransactionPayload,
  filterDirtyLineItems,
  filterValidLineItems,
  normalizeLineItems
} from "@/utils";
import { BILLSTATUS, type SyncResponse } from "@shared/types";
import debounce from "lodash.debounce";

let isSyncing = false;

const syncLogic = async () => {
  if (isSyncing) return;

  const { activeTabId } = useBillingTabsStore.getState();
  const sessionStore = useBillingSessionStore.getState();
  const session = activeTabId ? sessionStore.sessions[activeTabId] : null;
  if (!activeTabId || !session) return;

  const { lineItems } = session;
  const { markItemAsSaving, markItemAsSynced, updateLineItemId, purgeDeletedItems, updateField } =
    sessionStore;
  const { billingId, billingType, transactionNo, customerId, billingDate, isMetaDataDirty } =
    session;

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  if (dirtyItems.length === 0 && !isMetaDataDirty) return;

  isSyncing = true;
  updateField(activeTabId, "status", BILLSTATUS.SAVING);
  markItemAsSaving(activeTabId, dirtyItems);

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
      updateField(activeTabId, "billingId", response.billingId);
    }

    const updateIdsMap: Map<string, string> = new Map(
      response.syncedItems.map((i) => [i.rowId, i.id])
    );
    const syncIds: Set<string> = new Set(response.syncedItems.map((i) => i.rowId));
    const purgeIds: Set<string> = new Set(response.deletedRowIds);

    updateLineItemId(activeTabId, updateIdsMap);
    markItemAsSynced(activeTabId, syncIds);
    purgeDeletedItems(activeTabId, purgeIds);
    updateField(activeTabId, "isMetaDataDirty", false);
  } catch (error) {
    console.error("Sync error:", error);
    updateField(activeTabId, "status", BILLSTATUS.ERROR);
  } finally {
    isSyncing = false;
    updateField(activeTabId, "status", BILLSTATUS.SAVED);

    const freshSession = useBillingSessionStore.getState().sessions[activeTabId];
    const freshValid = filterValidLineItems(freshSession?.lineItems ?? []);
    const pendingItems = filterDirtyLineItems(freshValid);

    if (pendingItems.length > 0) {
      processSyncQueue();
    }
  }
};

export const processSyncQueue = debounce(syncLogic, 800);
