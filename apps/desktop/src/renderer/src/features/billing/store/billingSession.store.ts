import { SYNCSTATUS } from "@/types/renderer.types";
import { type BillingProductDTO, type UnifiedTransactionItem } from "@shared/types";
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
import type { BillingPrintOptions, BillingSessionData, LineItem } from "./billingSession.types";

type BillingSessionStore = {
  sessions: Record<string, BillingSessionData>;
  initSession: (tabId: string | null) => void;
  removeSession: (tabId: string | null) => void;
  hydrateSession: (
    tabId: string | null,
    fields: Partial<Omit<BillingSessionData, "lineItems">>
  ) => void;

  // generic field updater
  updateField: <K extends keyof BillingSessionData>(
    tabId: string | null,
    field: K,
    value: BillingSessionData[K]
  ) => void;

  updatePrintOption: <K extends keyof BillingPrintOptions>(
    tabId: string | null,
    field: K,
    value: BillingPrintOptions[K]
  ) => void;

  // LineItem actions
  setLineItems: (tabId: string | null, itemsArray: UnifiedTransactionItem[]) => void;
  addEmptyLineItem: (tabId: string | null, type?: "button") => void;
  addLineItem: (tabId: string | null, rowId: string, newItem: BillingProductDTO) => void;
  updateLineItem: <K extends keyof LineItem>(
    tabId: string | null,
    rowId: string,
    field: K,
    value: LineItem[K]
  ) => void;
  deleteLineItem: (tabId: string | null, rowId: string) => void;
  reorderLineItems: (tabId: string | null, activeRowId: string, overRowId: string) => void;
  setAllChecked: (tabId: string | null, checked: boolean) => void;
  markItemAsSaving: (tabId: string | null, items: LineItem[]) => void;
  markItemAsSynced: (tabId: string | null, rowIds: Set<string>) => void;
  revertItemToDirty: (tabId: string | null, items: LineItem[]) => void;
  updateLineItemId: (tabId: string | null, idMap: Map<string, string>) => void; // <rowId, id(i.e saleItem.id || estimateItem.id)>
  purgeDeletedItems: (tabId: string | null, rowIds: Set<string>) => void;
  // reset
};

export const useBillingSessionStore = create<BillingSessionStore>()(
  devtools(
    immer((set) => ({
      sessions: {},

      initSession: (tabId) =>
        set(
          (state) => {
            if (!tabId) return;
            if (!state.sessions[tabId]) {
              state.sessions[tabId] = createInitialSession();
            }
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
            Object.assign(state.sessions[tabId], fields);
          },
          false,
          "billingSession/hydrateSession"
        ),

      updateField: (tabId, field, value) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            session[field] = value;
            session.isMetaDataDirty = true;
          },
          false,
          "billingSession/updateField"
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

      // add empty row
      addEmptyLineItem: (tabId, type) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            const length = session.lineItems.length;
            if (type !== "button" && session.lineItems[length - 1]!.name === "") {
              return;
            }
            session.lineItems.push(createInitialLineItem(nextPosition(session.lineItems)));
          },
          false,
          "billingSession/addEmptyLineItem"
        ),

      // add new item on selection
      addLineItem: (tabId, rowId, newItem) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            // get index of item at rowId
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
              totalPrice: 0, // temporary
              checkedQty: oldItemCheckedQty,
              position: oldItem.position,
              isInventoryItem: true,
              syncStatus: SYNCSTATUS.IS_DIRTY,
              isDeleted: false
            };

            session.lineItems[index] = reCalculateLineItem(newLineItem);
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

            let finalValue: any = value;
            let isInventoryItem = item.isInventoryItem;

            if (field === "price" || field === "quantity") {
              finalValue = value;
              isInventoryItem = true;
            } else {
              finalValue = value;
            }

            let updatedItem: LineItem = { ...item };

            if (field === "productSnapshot") {
              updatedItem = {
                ...updatedItem,
                productId: null,
                name: "",
                weight: null,
                unit: null,
                mrp: null
              };
              isInventoryItem = false;
            }

            // apply the changed field
            (updatedItem as any)[field] = finalValue;
            updatedItem.isInventoryItem = isInventoryItem;
            updatedItem.syncStatus = SYNCSTATUS.IS_DIRTY;

            // if price or quantity changed, recalculate totalPrice
            if (["quantity", "price"].includes(field)) {
              updatedItem = reCalculateLineItem(updatedItem);
            }

            // replace the old item with the new one
            session.lineItems[index] = updatedItem;
          },
          false,
          "billingSession/updateLineItem"
        ),

      deleteLineItem: (tabId, rowId) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            const itemToBeDeleted = session.lineItems.find((item) => item.rowId === rowId);
            if (itemToBeDeleted) {
              itemToBeDeleted.isDeleted = true;
            }
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
              if (item.productSnapshot.trim() !== "" && !item.isDeleted) {
                filled.push(item);
              } else {
                others.push(item);
              }
            }

            const fromIdx = filled.findIndex((i) => i.rowId === activeRowId);
            const toIdx = filled.findIndex((i) => i.rowId === overRowId);

            if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

            let newPos: number;
            let needsRebalance = false;

            if (fromIdx < toIdx) {
              const prevPos = filled[toIdx]!.position;
              if (toIdx + 1 >= filled.length) {
                newPos = prevPos + POSITION_GAP;
              } else {
                const nextPos = filled[toIdx + 1]!.position;
                if (nextPos - prevPos <= MIN_GAP) needsRebalance = true;
                newPos = midpointPosition(prevPos, nextPos);
              }
            } else {
              const nextPos = filled[toIdx]!.position;
              if (toIdx === 0) {
                if (nextPos <= MIN_GAP) needsRebalance = true;
                newPos = Math.floor(nextPos / 2);
              } else {
                const prevPos = filled[toIdx - 1]!.position;
                if (nextPos - prevPos <= MIN_GAP) needsRebalance = true;
                newPos = midpointPosition(prevPos, nextPos);
              }
            }

            const [moved] = filled.splice(fromIdx, 1);
            filled.splice(toIdx, 0, moved!);

            if (needsRebalance) {
              const newPositions = rebalancePositions(filled);
              for (const item of filled) {
                item.position = newPositions.get(item.rowId)!;
                item.syncStatus = SYNCSTATUS.IS_DIRTY;
              }
            } else {
              moved!.position = newPos;
              moved!.syncStatus = SYNCSTATUS.IS_DIRTY;
            }

            session.lineItems = [...filled, ...others];
          },
          false,
          "billingSession/reorderLineItems"
        ),

      setAllChecked: (tabId, checked) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            session.lineItems.forEach((item) => {
              item.syncStatus = SYNCSTATUS.IS_DIRTY;
              item.checkedQty = checked ? parseFloat(item.quantity || "0") : 0;
            });
          },
          false,
          "billingSession/setAllChecked"
        ),

      markItemAsSaving: (tabId, items) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            const ids = new Set(items.map((i) => i.id));

            session.lineItems.forEach((item) => {
              if (ids.has(item.id)) {
                item.syncStatus = SYNCSTATUS.SAVING;
              }
            });
          },
          false,
          "billingSession/markItemAsSaving"
        ),

      markItemAsSynced: (tabId, rowIds) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            session.lineItems.forEach((item) => {
              if (rowIds.has(item.rowId)) {
                item.syncStatus = SYNCSTATUS.SYNCED;
              }
            });
          },
          false,
          "billingSession/markItemAsSynced"
        ),

      revertItemToDirty: (tabId, items) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            const rowIds = new Set(items.map((i) => i.rowId));
            session.lineItems.forEach((item) => {
              if (rowIds.has(item.rowId) && item.syncStatus === SYNCSTATUS.SAVING) {
                item.syncStatus = SYNCSTATUS.IS_DIRTY;
              }
            });
          },
          false,
          "billingSession/revertItemToDirty"
        ),

      updateLineItemId: (tabId, idMap) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId] || idMap.size === 0) return;
            const session = state.sessions[tabId];

            for (const item of session.lineItems) {
              const newId = idMap.get(item.rowId);
              if (newId !== undefined) {
                item.id = newId;
              }
            }
          },
          false,
          "billingSession/updateLineItemId"
        ),

      purgeDeletedItems: (tabId, rowIds) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            session.lineItems = session.lineItems.filter((item) => !rowIds.has(item.rowId));
          },
          false,
          "billingSession/purgeDeletedItems"
        )
    })),
    { name: "billing-sessions-store" }
  )
);
