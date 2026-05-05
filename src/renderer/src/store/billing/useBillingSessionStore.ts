import { SYNCSTATUS } from "@/types";
import { type Product, type UnifiedTransactionItem } from "@shared/types";
import { convertToRupees } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  createInitialLineItem,
  createInitialSession,
  normalizeLineItems,
  reCalculateLineItem
} from "./billingSession.helpers";
import type { BillingSessionData, LineItem } from "./billingSession.types";

type BillingSessionStore = {
  sessions: Record<string, BillingSessionData>;
  initSession: (tabId: string | null) => void;
  removeSession: (tabId: string | null) => void;

  // generic field updater
  updateField: <K extends keyof BillingSessionData>(
    tabId: string | null,
    field: K,
    value: BillingSessionData[K]
  ) => void;

  // LineItem actions
  setLineItems: (tabId: string | null, itemsArray: UnifiedTransactionItem[]) => void;
  addEmptyLineItem: (tabId: string | null, type?: "button") => void;
  addLineItem: (tabId: string | null, rowId: string, newItem: Product) => void;
  updateLineItem: <K extends keyof LineItem>(
    tabId: string | null,
    rowId: string,
    field: K,
    value: LineItem[K]
  ) => void;
  deleteLineItem: (tabId: string | null, rowId: string) => void;
  setAllChecked: (tabId: string | null, checked: boolean) => void;
  markItemAsSaving: (tabId: string | null, items: LineItem[]) => void;
  markItemAsSynced: (tabId: string | null, rowIds: Set<string>) => void;
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
            if (type !== "button" && session.lineItems[length - 1].name === "") {
              return;
            }
            session.lineItems.push(createInitialLineItem());
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
            const oldItem = session.lineItems[index];

            const oldQtyNum = parseFloat(oldItem.quantity || "0");
            const oldItemQuantity = oldQtyNum >= 1 ? oldQtyNum : 1;
            const oldItemCheckedQty = oldItem.checkedQty > 1 ? oldItem.checkedQty : 0;

            const newLineItem: LineItem = {
              id: oldItem.id,
              rowId: uuidv4(),
              productId: newItem.id,
              name: newItem.name,
              productSnapshot: newItem.productSnapshot,
              weight: newItem.weight,
              unit: newItem.unit,
              mrp: newItem.mrp,
              price: newItem.price ? convertToRupees(newItem.price).toString() : "",
              quantity: oldItemQuantity.toString(),
              totalPrice: 0, // temporary
              checkedQty: oldItemCheckedQty,
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

            // item to be updated
            const item = session.lineItems[index];

            let finalValue: any = value;
            let isInventoryItem = item.isInventoryItem;

            if (field === "price" || field === "quantity") {
              finalValue = value;
              isInventoryItem = true;
            } else {
              finalValue = value;
            }

            let updatedItem = { ...item };

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

      updateLineItemId: (tabId, idMap) =>
        set(
          (state) => {
            if (!tabId || !state.sessions[tabId]) return;
            const session = state.sessions[tabId];

            session.lineItems.forEach((item) => {
              if (idMap.has(item.rowId)) {
                item.id = idMap.get(item.rowId)!; // type assertion - this value never be undefined
              }
            });
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
