import { useSearchDropdownStore } from "@/features/billing/product-search/searchDropdown.store";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import type { BillingSessionData, LineItem } from "@/features/billing/store/billingSession.types";
import { SYNCSTATUS } from "@/types/renderer.types";
import {
  buildTransactionPayload,
  filterDirtyLineItems,
  filterValidLineItems,
  normalizeLineItems
} from "@/utils/renderer.utils";

export type RequestSnapshot = {
  billingId: string | null;
  billingType: BillingSessionData["billingType"];
  customerId: string;
  metadataRevision: number;
  itemRevisions: Map<string, number>;
  payload: ReturnType<typeof buildTransactionPayload>;
};

/**
 * checks if bill details changed after the last save.
 *
 * example: revision 3 with saved revision 2 is still pending.
 */
function hasMetadataPending(session: BillingSessionData): boolean {
  return session.metadataRevision > session.persistedMetadataRevision;
}

/**
 * checks if a row is waiting for the server.
 *
 * example: a dirty row and a saving row both return true.
 */
function hasItemPending(item: LineItem): boolean {
  return item.syncStatus === SYNCSTATUS.IS_DIRTY || item.syncStatus === SYNCSTATUS.SAVING;
}

/**
 * checks if a billing tab still has anything to save.
 *
 * example: changing a note or a row makes this return true.
 */
export function hasPendingBillingWork(tabId: string): boolean {
  const session = useBillingSessionStore.getState().sessions[tabId];
  return Boolean(
    session && (hasMetadataPending(session) || session.lineItems.some(hasItemPending))
  );
}

/**
 * checks if a changed row is safe to send.
 *
 * example: a deleted saved row can be sent because it has an id.
 */
function isSendableItem(item: LineItem): boolean {
  if (item.isDeleted) return Boolean(item.id);
  return filterValidLineItems([item]).length === 1;
}

/**
 * checks if typed product text has not been confirmed yet.
 *
 * example: typing milk without choosing a result returns true.
 */
export function hasUnconfirmedProductDraft(tabId: string): boolean {
  const draft = useSearchDropdownStore.getState().getDraft(tabId);
  if (!draft?.activeRowId) return false;

  const item = useBillingSessionStore
    .getState()
    .sessions[tabId]?.lineItems.find((candidate) => candidate.rowId === draft.activeRowId);

  return Boolean(item && draft.itemQuery !== item.productSnapshot);
}

/**
 * builds one stable request from the current tab state.
 *
 * example: two dirty rows become one request with both row revisions.
 */
export function createRequestSnapshot(session: BillingSessionData): RequestSnapshot | null {
  const dirtyItems = filterDirtyLineItems(session.lineItems);
  const sendableItems = dirtyItems.filter(isSendableItem);
  const metadataPending = hasMetadataPending(session);

  if (!session.billingId && sendableItems.filter((item) => !item.isDeleted).length === 0) {
    return null;
  }
  if (session.billingId && sendableItems.length === 0 && !metadataPending) return null;
  if (!session.customerId) return null;

  const itemRevisions = new Map(sendableItems.map((item) => [item.rowId, item.revision]));
  return {
    billingId: session.billingId,
    billingType: session.billingType,
    customerId: session.customerId,
    metadataRevision: session.metadataRevision,
    itemRevisions,
    payload: buildTransactionPayload({
      billingType: session.billingType,
      transactionNo: session.transactionNo,
      customerId: session.customerId,
      items: normalizeLineItems(sendableItems),
      notes: session.notes,
      addToAccounting: session.addToAccounting,
      createdAt: session.billingDate.toISOString(),
      billingId: session.billingId ? undefined : session.creationBillingId,
      creationToken: session.billingId ? undefined : session.creationToken
    })
  };
}
