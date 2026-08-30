import { SYNCSTATUS } from "@/types/renderer.types";
import { BILLSTATUS, type BillingProductDTO, type UnifiedTransactionItem } from "@shared/types";
import { paisaToRupees } from "@shared/utils/utils";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  createInitialLineItem,
  createInitialSession,
  midpointPosition,
  MIN_GAP,
  nextPosition,
  normalizeLineItems,
  POSITION_GAP,
  rebalancePositions,
  reCalculateLineItem
} from "./billingSession.helpers";
import type {
  BillingPrintOptions,
  BillingSessionData,
  LineItem,
  PersistentBillingField,
  UiBillingField
} from "./billingSession.types";

type PersistentLineItemField = Exclude<
  keyof LineItem,
  "id" | "rowId" | "totalPrice" | "syncStatus" | "revision"
>;

export type SyncAcknowledgement = {
  itemRevisions: Map<string, number>;
  metadataRevision: number;
  itemIds: Map<string, string>;
  deletedRowIds: Set<string>;
};

type BillingSessionStore = {
  sessions: Record<string, BillingSessionData>;
  initSession: (tabId: string | null) => void;
  removeSession: (tabId: string | null) => void;
  hydrateSession: (
    tabId: string | null,
    fields: Partial<Omit<BillingSessionData, "lineItems">>
  ) => void;
  updatePersistentField: <K extends PersistentBillingField>(
    tabId: string | null,
    field: K,
    value: BillingSessionData[K]
  ) => void;

  updatePrintOption: <K extends keyof BillingPrintOptions>(
    tabId: string | null,
    field: K,
    value: BillingPrintOptions[K]
  ) => void;
  updateUiField: <K extends UiBillingField>(
    tabId: string | null,
    field: K,
    value: BillingSessionData[K]
  ) => void;
  acknowledgeSync: (tabId: string | null, acknowledgement: SyncAcknowledgement) => void;
  failSync: (tabId: string | null, itemRevisions: Map<string, number>) => void;

  // LineItem actions
  setLineItems: (tabId: string | null, itemsArray: UnifiedTransactionItem[]) => void;
  addEmptyLineItem: (tabId: string | null, type?: "button") => void;
  addLineItem: (tabId: string | null, rowId: string, newItem: BillingProductDTO) => void;
  updateLineItem: <K extends PersistentLineItemField>(
    tabId: string | null,
    rowId: string,
    field: K,
    value: LineItem[K]
  ) => void;
  deleteLineItem: (tabId: string | null, rowId: string) => void;
  reorderLineItems: (tabId: string | null, activeRowId: string, overRowId: string) => void;
  setAllChecked: (tabId: string | null, checked: boolean) => void;
  markItemsAsSaving: (tabId: string | null, itemRevisions: Map<string, number>) => void; // Map<rowId, revisionNo>
};

function fieldValuesEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  return Object.is(left, right);
}

export const useBillingSessionStore = create<BillingSessionStore>()(
  devtools(
    immer((set) => ({
      sessions: {},

      initSession: (tabId) =>
        set(
          (state) => {
            if (!tabId) return;
            if (!state.sessions[tabId]) state.sessions[tabId] = createInitialSession();
          },
          false,
          "billingSession/initSession"
        ),

      removeSession: (tabId) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            delete state.sessions[tabId];
          },
          false,
          "billingSession/removeSession"
        ),

      hydrateSession: (tabId, fields) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const hadPendingMetadata = session.metadataRevision > session.persistedMetadataRevision;
            Object.assign(session, fields);
            if (!hadPendingMetadata) session.persistedMetadataRevision = session.metadataRevision;
          },
          false,
          "billingSession/hydrateSession"
        ),

      updatePersistentField: (tabId, field, value) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            if (fieldValuesEqual(session[field], value)) return;
            session[field] = value;
            session.metadataRevision += 1;
            session.status = BILLSTATUS.UNSAVED;
          },
          false,
          "billingSession/updatePersistentField"
        ),

      updateUiField: (tabId, field, value) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            state.sessions[tabId][field] = value;
          },
          false,
          "billingSession/updateUiField"
        ),

      acknowledgeSync: (tabId, acknowledgement) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const acknowledgedRows = new Set([
              ...acknowledgement.itemIds.keys(),
              ...acknowledgement.deletedRowIds
            ]);

            for (const item of session.lineItems) {
              const assignedId = acknowledgement.itemIds.get(item.rowId);
              if (assignedId) item.id = assignedId;
            }

            session.lineItems = session.lineItems.filter((item) => {
              const sentRevision = acknowledgement.itemRevisions.get(item.rowId);
              if (
                acknowledgement.deletedRowIds.has(item.rowId) &&
                sentRevision !== undefined &&
                item.revision === sentRevision
              ) {
                return false;
              }

              if (sentRevision !== undefined && item.revision === sentRevision) {
                item.syncStatus = acknowledgedRows.has(item.rowId)
                  ? SYNCSTATUS.SYNCED
                  : SYNCSTATUS.IS_DIRTY;
              }
              return true;
            });

            session.persistedMetadataRevision = Math.max(
              session.persistedMetadataRevision,
              Math.min(acknowledgement.metadataRevision, session.metadataRevision)
            );
          },
          false,
          "billingSession/acknowledgeSync"
        ),

      failSync: (tabId, itemRevisions) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            for (const item of session.lineItems) {
              const sentRevision = itemRevisions.get(item.rowId);
              if (sentRevision !== undefined && item.revision === sentRevision) {
                item.syncStatus = SYNCSTATUS.IS_DIRTY;
              }
            }
          },
          false,
          "billingSession/failSync"
        ),

      updatePrintOption: (tabId, field, value) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            state.sessions[tabId].printOptions[field] = value;
          },
          false,
          "billingSession/updatePrintOption"
        ),

      setLineItems: (tabId, itemsArray) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            state.sessions[tabId].lineItems = normalizeLineItems(itemsArray);
          },
          false,
          "billingSession/setLineItems"
        ),

      addEmptyLineItem: (tabId, type) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const lastItem = session.lineItems.at(-1);
            if (type !== "button" && lastItem?.name === "") return;
            session.lineItems.push(createInitialLineItem(nextPosition(session.lineItems)));
          },
          false,
          "billingSession/addEmptyLineItem"
        ),

      addLineItem: (tabId, rowId, newItem) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const index = session.lineItems.findIndex((item) => item.rowId === rowId);
            if (index === -1) return;
            const oldItem = session.lineItems[index]!;
            const oldQtyNum = parseFloat(oldItem.quantity || "0");
            const oldItemQuantity = oldQtyNum >= 1 ? oldQtyNum : 1;
            const oldItemCheckedQty = oldItem.checkedQty > 1 ? oldItem.checkedQty : 0;

            const newLineItem: LineItem = {
              id: oldItem.id,
              rowId: oldItem.rowId,
              productId: newItem.id,
              name: newItem.name,
              productSnapshot: newItem.productSnapshot,
              weight: newItem.weight,
              unit: newItem.unit,
              mrp: newItem.mrp,
              price: newItem.price ? paisaToRupees(newItem.price).toString() : "",
              quantity: oldItemQuantity.toString(),
              totalPrice: 0,
              checkedQty: oldItemCheckedQty,
              position: oldItem.position,
              isInventoryItem: true,
              syncStatus: SYNCSTATUS.IS_DIRTY,
              isDeleted: false,
              revision: oldItem.revision + 1
            };

            session.lineItems[index] = reCalculateLineItem(newLineItem);
            session.status = BILLSTATUS.UNSAVED;
          },
          false,
          "billingSession/addLineItem"
        ),

      updateLineItem: (tabId, rowId, field, value) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const index = session.lineItems.findIndex((item) => item.rowId === rowId);
            if (index === -1) return;
            const item = session.lineItems[index]!;
            if (fieldValuesEqual(item[field], value)) return;

            let updatedItem: LineItem = { ...item };
            let isInventoryItem = item.isInventoryItem;
            if (field === "price" || field === "quantity") isInventoryItem = true;
            if (field === "productSnapshot") {
              updatedItem = {
                ...updatedItem,
                productId: null,
                name: String(value),
                weight: null,
                unit: null,
                mrp: null
              };
              isInventoryItem = false;
            }

            (updatedItem as LineItem)[field] = value;
            updatedItem.isInventoryItem = isInventoryItem;
            updatedItem.syncStatus = SYNCSTATUS.IS_DIRTY;
            updatedItem.revision += 1;
            if (field === "quantity" || field === "price") {
              updatedItem = reCalculateLineItem(updatedItem);
            }
            if (field === "quantity") {
              const quantity = Math.max(0, parseFloat(updatedItem.quantity) || 0);
              updatedItem.checkedQty = Math.min(updatedItem.checkedQty, quantity);
            }
            session.lineItems[index] = updatedItem;
            session.status = BILLSTATUS.UNSAVED;
          },
          false,
          "billingSession/updateLineItem"
        ),

      deleteLineItem: (tabId, rowId) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const index = session.lineItems.findIndex((item) => item.rowId === rowId);
            if (index === -1) return;
            const item = session.lineItems[index]!;

            if (!item.id && item.syncStatus !== SYNCSTATUS.SAVING) {
              item.isDeleted = true;
              item.revision += 1;
              item.syncStatus = SYNCSTATUS.SYNCED;
              return;
            }

            item.isDeleted = true;
            item.revision += 1;
            item.syncStatus = SYNCSTATUS.IS_DIRTY;
            session.status = BILLSTATUS.UNSAVED;
          },
          false,
          "billingSession/deleteLineItem"
        ),

      reorderLineItems: (tabId, activeRowId, overRowId) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            const filled: LineItem[] = [];
            const others: LineItem[] = [];
            for (const item of session.lineItems) {
              if (item.productSnapshot.trim() !== "" && !item.isDeleted) filled.push(item);
              else others.push(item);
            }

            const fromIdx = filled.findIndex((item) => item.rowId === activeRowId);
            const toIdx = filled.findIndex((item) => item.rowId === overRowId);
            if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

            let newPosition: number;
            let needsRebalance = false;
            if (fromIdx < toIdx) {
              const previousPosition = filled[toIdx]!.position;
              if (toIdx + 1 >= filled.length) newPosition = previousPosition + POSITION_GAP;
              else {
                const nextItemPosition = filled[toIdx + 1]!.position;
                if (nextItemPosition - previousPosition <= MIN_GAP) needsRebalance = true;
                newPosition = midpointPosition(previousPosition, nextItemPosition);
              }
            } else {
              const nextItemPosition = filled[toIdx]!.position;
              if (toIdx === 0) {
                if (nextItemPosition <= MIN_GAP) needsRebalance = true;
                newPosition = Math.floor(nextItemPosition / 2);
              } else {
                const previousPosition = filled[toIdx - 1]!.position;
                if (nextItemPosition - previousPosition <= MIN_GAP) needsRebalance = true;
                newPosition = midpointPosition(previousPosition, nextItemPosition);
              }
            }

            const [moved] = filled.splice(fromIdx, 1);
            filled.splice(toIdx, 0, moved!);
            if (needsRebalance) {
              const positions = rebalancePositions(filled);
              for (const item of filled) {
                const position = positions.get(item.rowId)!;
                if (item.position === position) continue;
                item.position = position;
                item.revision += 1;
                item.syncStatus = SYNCSTATUS.IS_DIRTY;
              }
            } else {
              moved!.position = newPosition;
              moved!.revision += 1;
              moved!.syncStatus = SYNCSTATUS.IS_DIRTY;
            }
            session.lineItems = [...filled, ...others];
            session.status = BILLSTATUS.UNSAVED;
          },
          false,
          "billingSession/reorderLineItems"
        ),

      setAllChecked: (tabId, checked) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];
            for (const item of session.lineItems) {
              if (
                item.isDeleted ||
                !item.productSnapshot.trim() ||
                !(parseFloat(item.price) > 0) ||
                !(parseFloat(item.quantity) > 0)
              )
                continue;
              const nextCheckedQuantity = checked ? parseFloat(item.quantity || "0") : 0;
              if (item.checkedQty === nextCheckedQuantity) continue;
              item.checkedQty = nextCheckedQuantity;
              item.revision += 1;
              item.syncStatus = SYNCSTATUS.IS_DIRTY;
              session.status = BILLSTATUS.UNSAVED;
            }
          },
          false,
          "billingSession/setAllChecked"
        ),

      markItemsAsSaving: (tabId, itemRevisions) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            for (const item of state.sessions[tabId].lineItems) {
              if (itemRevisions.get(item.rowId) === item.revision) {
                item.syncStatus = SYNCSTATUS.SAVING;
              }
            }
          },
          false,
          "billingSession/markItemsAsSaving"
        )
    })),
    { name: "billing-sessions-store" }
  )
);
