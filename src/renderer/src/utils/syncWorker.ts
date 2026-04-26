import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
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

  const { lineItems, markItemAsSaving, markItemAsSynced, updateLineItemId, purgeDeletedItems } =
    useLineItemsStore.getState();
  const {
    billingId,
    setBillingId,
    billingType,
    transactionNo,
    customerId,
    setStatus,
    billingDate,
    isMetaDataDirty,
    markMetaDataSynced
  } = useBillingStore.getState();

  const validLineItems = filterValidLineItems(lineItems);
  const dirtyItems = filterDirtyLineItems(validLineItems);

  if (dirtyItems.length === 0 && !isMetaDataDirty) return;

  isSyncing = true;
  setStatus(BILLSTATUS.SAVING);
  markItemAsSaving(dirtyItems);

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
      setBillingId(response.billingId);
    }

    const updateIdsMap: Map<string, string> = new Map(
      response.syncedItems.map((i) => [i.rowId, i.id])
    );
    const syncIds: Set<string> = new Set(response.syncedItems.map((i) => i.rowId));
    const purgeIds: Set<string> = new Set(response.deletedRowIds);

    updateLineItemId(updateIdsMap);
    markItemAsSynced(syncIds);
    purgeDeletedItems(purgeIds);
    markMetaDataSynced();
  } catch (error) {
    console.error("Sync error:", error);
    setStatus(BILLSTATUS.ERROR);
  } finally {
    isSyncing = false;
    setStatus(BILLSTATUS.SAVED);

    const freshState = useLineItemsStore.getState();
    const freshValid = filterValidLineItems(freshState.lineItems);
    const pendingItems = filterDirtyLineItems(freshValid);

    if (pendingItems.length > 0) {
      processSyncQueue();
    }
  }
};

export const processSyncQueue = debounce(syncLogic, 800);
