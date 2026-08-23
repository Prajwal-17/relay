import type { SyncResponse } from "@shared/types";
import type { RequestSnapshot } from "./syncWorker.helpers";

export class BillingSyncProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingSyncProtocolError";
  }
}

/**
 * checks if a value is a plain response object.
 *
 * example: null returns false and an object returns true.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

/**
 * checks one saved-row acknowledgement from the server.
 *
 * example: a row needs a row id, saved id, and update time.
 */
function isSyncedItem(value: unknown): value is SyncResponse["syncedItems"][number] {
  return Boolean(
    isRecord(value) &&
    typeof value.rowId === "string" &&
    typeof value.id === "string" &&
    typeof value.updatedAt === "string"
  );
}

/**
 * checks that the server confirmed every row we sent exactly once.
 *
 * example: if rows a and b were sent, a reply that only confirms a is rejected.
 */
export function validateSyncResponse(
  response: unknown,
  snapshot: RequestSnapshot
): asserts response is SyncResponse {
  if (!isRecord(response)) {
    throw new BillingSyncProtocolError("Billing sync returned an invalid response.");
  }

  const syncedItems = response.syncedItems;
  const deletedRowIds = response.deletedRowIds;
  if (!Array.isArray(syncedItems) || !Array.isArray(deletedRowIds)) {
    throw new BillingSyncProtocolError("Billing sync response is missing acknowledgements.");
  }

  const expectedItems = new Map(snapshot.payload.data.items.map((item) => [item.rowId, item]));
  const seenRowIds = new Set<string>();
  const syncedRowIds = new Set<string>();
  const confirmedDeletedRowIds = new Set<string>();

  for (const item of syncedItems) {
    if (!isSyncedItem(item) || seenRowIds.has(item.rowId) || !expectedItems.has(item.rowId)) {
      throw new BillingSyncProtocolError("Billing sync returned an unknown or duplicate row.");
    }
    seenRowIds.add(item.rowId);
    syncedRowIds.add(item.rowId);
  }

  for (const rowId of deletedRowIds) {
    if (typeof rowId !== "string" || seenRowIds.has(rowId) || !expectedItems.has(rowId)) {
      throw new BillingSyncProtocolError("Billing sync returned an unknown or duplicate row.");
    }
    seenRowIds.add(rowId);
    confirmedDeletedRowIds.add(rowId);
  }

  for (const [rowId, item] of expectedItems) {
    const acknowledged = item.isDeleted
      ? confirmedDeletedRowIds.has(rowId)
      : syncedRowIds.has(rowId);
    if (!acknowledged) {
      throw new BillingSyncProtocolError("Billing sync did not acknowledge every requested row.");
    }
  }

  if (
    !snapshot.billingId &&
    (typeof response.billingId !== "string" ||
      !Number.isSafeInteger(response.transactionNo) ||
      Number(response.transactionNo) < 1)
  ) {
    throw new BillingSyncProtocolError("Billing create response is missing its identity.");
  }
}
