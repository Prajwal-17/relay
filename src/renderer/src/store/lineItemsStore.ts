import { SYNCSTATUS, type SyncStatus } from "@/types";
import type { Product, UnifiedTransactionItem } from "@shared/types";
import { convertToPaisa, convertToRupees, fromMilliUnits, toMilliUnits } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type LineItem = {
  id: string | null; // saleItem.id | estimateItem.id
  rowId: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: string;
  quantity: string;
  totalPrice: number; // UI-only
  checkedQty: number;
  isInventoryItem: boolean;
  syncStatus: SyncStatus; // FE-only
  isDeleted: boolean; // delete item flag
};

type LineItemsStore = {
  isCountColumnVisible: boolean;
  setIsCountControlsVisible: () => void;
  lineItems: LineItem[];
  setLineItems: (itemsArray: UnifiedTransactionItem[]) => void;
  addEmptyLineItem: (type?: "button") => void;
  addLineItem: (rowId: string, newItem: Product) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  deleteLineItem: (rowId: string) => void;
  setAllChecked: (checked: boolean) => void;
  markItemAsSaving: (items: LineItem[]) => void;
  markItemAsSynced: (rowIds: Set<string>) => void;
  updateLineItemId: (idMap: Map<string, string>) => void; // <rowId, id(i.e saleItem.id || estimateItem.id)>
  purgeDeletedItems: (rowIds: Set<string>) => void;
  reset: () => void;
};

function normalizeLineItems(itemsArray: UnifiedTransactionItem[]) {
  if (!itemsArray || itemsArray.length === 0) {
    return [initialLineItem()];
  }

  const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
    id: item.id,
    rowId: uuidv4(),
    productId: item.productId,
    name: item.name,
    productSnapshot: item.productSnapshot,
    weight: item.weight,
    unit: item.unit,
    mrp: item.mrp,
    price: item.price ? convertToRupees(Number(item.price)).toString() : "",
    quantity: fromMilliUnits(item.quantity).toString(),
    totalPrice: item.totalPrice,
    checkedQty: fromMilliUnits(item.checkedQty),
    isInventoryItem: item.productId ? true : false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false
  }));

  return [...lineItemsArray, initialLineItem()];
}

function initialLineItem() {
  const lineItem: LineItem = {
    id: null,
    rowId: uuidv4(),
    productId: null,
    name: "",
    productSnapshot: "",
    weight: null,
    unit: null,
    mrp: null,
    price: "",
    quantity: "",
    totalPrice: 0,
    checkedQty: 0,
    isInventoryItem: false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false
  };

  return lineItem;
}

const reCalculateLineItem = (item: LineItem): LineItem => {
  const priceInRupees = parseFloat(item.price) || 0;
  const qtyInUnits = parseFloat(item.quantity) || 0;
  const priceInPaisa = convertToPaisa(priceInRupees);
  const qtyInMilli = toMilliUnits(qtyInUnits);
  const totalPrice = Math.round((priceInPaisa * qtyInMilli) / 1000);
  return {
    ...item,
    totalPrice: totalPrice
  };
};

export const useLineItemsStore = create<LineItemsStore>()(
  devtools(
    immer((set) => ({
      isCountColumnVisible: false,
      setIsCountControlsVisible: () =>
        set(
          (state) => {
            state.isCountColumnVisible = !state.isCountColumnVisible;
          },
          false,
          "lineItems/setIsCountControlsVisible"
        ),

      lineItems: [initialLineItem()],

      setLineItems: (itemsArray) =>
        set(
          (state) => {
            state.lineItems = normalizeLineItems(itemsArray);
          },
          false,
          "lineItems/setLineItems"
        ),

      // add empty row
      addEmptyLineItem: (type) =>
        set(
          (state) => {
            const length = state.lineItems.length;
            if (type !== "button" && state.lineItems[length - 1].name === "") {
              return;
            }
            state.lineItems.push(initialLineItem());
          },
          false,
          "lineItems/addEmptyLineItem"
        ),

      // add new item on selection
      addLineItem: (rowId, newItem) =>
        set(
          (state) => {
            // get index of item at rowId
            const index = state.lineItems.findIndex((item) => item.rowId === rowId);
            if (index === -1) return;
            const oldItem = state.lineItems[index];

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

            state.lineItems[index] = reCalculateLineItem(newLineItem);
          },
          false,
          "lineItems/addLineItem"
        ),

      // update on field change
      updateLineItem: (rowId, field, value) =>
        set(
          (state) => {
            const index = state.lineItems.findIndex((item) => item.rowId === rowId);
            if (index === -1) return;

            // item to be updated
            const item = state.lineItems[index];

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
            state.lineItems[index] = updatedItem;
          },
          false,
          "lineItems/updateLineItem"
        ),
      // delete a row
      deleteLineItem: (rowId) =>
        set(
          (state) => {
            const itemToBeDeleted = state.lineItems.find((item) => item.rowId === rowId);
            if (itemToBeDeleted) {
              itemToBeDeleted.isDeleted = true;
            }
          },
          false,
          "lineItems/deleteLineItem"
        ),

      setAllChecked: (checked: boolean) =>
        set(
          (state) => {
            state.lineItems.forEach((item) => {
              item.syncStatus = SYNCSTATUS.IS_DIRTY;
              item.checkedQty = checked ? parseFloat(item.quantity || "0") : 0;
            });
          },
          false,
          "lineItems/setAllChecked"
        ),

      markItemAsSaving: (items) =>
        set(
          (state) => {
            const ids = new Set(items.map((i) => i.id));

            state.lineItems.forEach((item) => {
              if (ids.has(item.id)) {
                item.syncStatus = SYNCSTATUS.SAVING;
              }
            });
          },
          false,
          "lineItems/markItemsAsSaved"
        ),

      markItemAsSynced: (rowIds) =>
        set(
          (state) => {
            state.lineItems.forEach((item) => {
              if (rowIds.has(item.rowId)) {
                item.syncStatus = SYNCSTATUS.SYNCED;
              }
            });
          },
          false,
          "lineItems/markItemsAsSynced"
        ),

      updateLineItemId: (idMap) =>
        set(
          (state) => {
            state.lineItems.forEach((item) => {
              if (idMap.has(item.rowId)) {
                item.id = idMap.get(item.rowId)!; // type assertion - this value never be undefined
              }
            });
          },
          false,
          "lineItems/updateLineItemId"
        ),

      purgeDeletedItems: (rowIds) =>
        set((state) => {
          state.lineItems = state.lineItems.filter((item) => !rowIds.has(item.rowId));
        }),

      reset: () =>
        set(
          () => ({
            isCountColumnVisible: false,
            lineItems: [initialLineItem()]
          }),
          false,
          "lineItems/reset"
        )
    })),
    { name: "line-items-store" }
  )
);
