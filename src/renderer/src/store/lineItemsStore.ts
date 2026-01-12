import { filterValidLineItems } from "@/utils";
import type { Product, UnifiedTransactionItem, UpdateResponseItem } from "@shared/types";
import { formatToRupees } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { useBillingStore } from "./billingStore";

export type LineItem = {
  id: string | null; // saleItem.id | estimateItem.id
  parentId: string; // sale.id | estimate.id,
  rowId: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: string;
  purchasePrice: number | null;
  quantity: string;
  totalPrice: number;
  checkedQty: number;
  isInventoryItem: boolean;
};

type LineItemsStore = {
  isCountColumnVisible: boolean;
  setIsCountControlsVisible: () => void;
  lineItems: LineItem[] | [];
  setLineItems: (itemsArray: UnifiedTransactionItem[]) => void;
  originalLineItems: LineItem[] | [];
  setOriginalLineItems: () => void;
  addEmptyLineItem: (type?: "button") => void;
  addLineItem: (rowId: string, newItem: Product) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  updateInternalIds: (responseItems: UpdateResponseItem[]) => void;
  deleteLineItem: (id: string) => void;
  setAllChecked: (checked: boolean) => void;
  reset: () => void;
};

function initialLineItem() {
  const lineItem: LineItem = {
    id: null,
    parentId: useBillingStore.getState().billingId ?? "",
    rowId: uuidv4(),
    productId: null,
    name: "",
    productSnapshot: "",
    weight: null,
    unit: null,
    mrp: null,
    price: "",
    purchasePrice: null,
    quantity: "",
    totalPrice: 0,
    checkedQty: 0,
    isInventoryItem: false
  };

  return lineItem;
}

function normalizeLineItems(itemsArray: UnifiedTransactionItem[]) {
  if (!itemsArray || itemsArray.length === 0) {
    return [initialLineItem()];
  }

  const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
    id: item.id,
    parentId: item.parentId,
    rowId: uuidv4(),
    productId: item.productId,
    name: item.name,
    productSnapshot: item.productSnapshot,
    weight: item.weight,
    unit: item.unit,
    mrp: item.mrp,
    price: item.price ? formatToRupees(Number(item.price)).toString() : "",
    purchasePrice: item.purchasePrice,
    quantity: item.quantity.toString(),
    totalPrice: item.totalPrice,
    checkedQty: item.checkedQty,
    isInventoryItem: item.productId ? true : false
  }));

  return [...lineItemsArray, initialLineItem()];
}

const reCalculateLineItem = (item: LineItem): LineItem => {
  const priceVal = parseFloat(item.price) || 0;
  const qtyVal = parseFloat(item.quantity) || 0;
  const rawTotal = priceVal * qtyVal;
  const totalPrice = Math.round(rawTotal * 100);
  return {
    ...item,
    totalPrice: totalPrice
  };
};

export const useLineItemsStore = create<LineItemsStore>((set) => ({
  isCountColumnVisible: false,
  setIsCountControlsVisible: () =>
    set((state) => ({
      isCountColumnVisible: !state.isCountColumnVisible
    })),

  // live state
  lineItems: [initialLineItem()],

  setLineItems: (itemsArray) =>
    set(() => ({
      lineItems: normalizeLineItems(itemsArray)
    })),

  // recently saved result from DB
  originalLineItems: [],
  setOriginalLineItems: () =>
    set((state) => ({
      originalLineItems: state.lineItems
    })),

  // add empty row
  addEmptyLineItem: (type) =>
    set((state) => {
      const length = state.lineItems.length;
      if (type !== "button" && state.lineItems[length - 1].name === "") {
        return state;
      }
      return {
        lineItems: [...state.lineItems, initialLineItem()]
      };
    }),

  // add new item on selection
  addLineItem: (rowId, newItem) =>
    set((state) => {
      /**
       * always create a new array to update the existing state array, coz react/zustand does
       * shallow comparison hence the array reference remains the same, so creating new array creates new reference
       * where react/zustand notices change
       */
      const currLineItems = [...state.lineItems];

      // get index of item at rowId
      const index = currLineItems.findIndex((item) => item.rowId === rowId);

      // existing line item at rowId
      const oldItem = currLineItems[index];
      const oldQtyNum = parseFloat(oldItem.quantity || "0");
      const oldItemQuantity = oldQtyNum >= 1 ? oldQtyNum : 1;
      const oldItemCheckedQty = oldItem.checkedQty > 1 ? oldItem.checkedQty : 0;

      const updatedItem: LineItem = {
        id: null,
        parentId: useBillingStore.getState().billingId ?? "",
        rowId: uuidv4(),
        productId: newItem.id,
        name: newItem.name,
        productSnapshot: newItem.productSnapshot,
        weight: newItem.weight,
        unit: newItem.unit,
        mrp: newItem.mrp,
        price: newItem.price ? formatToRupees(newItem.price).toString() : "",
        purchasePrice: newItem.purchasePrice,
        quantity: oldItemQuantity.toString(),
        totalPrice: parseFloat((oldItemQuantity * newItem.price).toFixed(2)),
        checkedQty: oldItemCheckedQty,
        isInventoryItem: true
      };

      currLineItems[index] = { ...updatedItem };

      return {
        lineItems: currLineItems
      };
    }),

  // update on field change
  updateLineItem: (rowId, field, value) =>
    set((state) => {
      const updatedLineItems = state.lineItems.map((item: LineItem) => {
        if (rowId !== item.rowId) return item;

        let finalValue: any;
        if (field === "price" || field === "quantity") {
          finalValue = value;
        } else {
          finalValue = value;
        }

        const draftItem = {
          ...item,
          [field]: finalValue
        };

        if (["quantity", "price"].includes(field)) {
          return reCalculateLineItem(draftItem);
        }
        return draftItem;
      });

      return {
        lineItems: updatedLineItems
      };
    }),

  /**
   * Update Internal Id's of LineItems array & update original LineItems
   */
  updateInternalIds: (responseItems) =>
    set((state) => {
      const updatedLineItems = state.lineItems.map((lineItem: LineItem) => {
        const current = responseItems.find((item) => item.rowId === lineItem.rowId);

        if (!current) return lineItem;
        if (current.id === lineItem.id && current.parentId === lineItem.parentId) {
          return lineItem;
        }

        return {
          ...lineItem,
          id: current?.id,
          parentId: current?.parentId
        };
      });

      return {
        lineItems: updatedLineItems,
        originalLineItems: filterValidLineItems(updatedLineItems)
      };
    }),

  // delete a row
  deleteLineItem: (id) =>
    set((state) => {
      const updatedLineItems = state.lineItems.filter((item) => item.rowId !== id);
      if (updatedLineItems.length === 0) {
        return {
          lineItems: [initialLineItem()]
        };
      }
      return {
        lineItems: updatedLineItems
      };
    }),

  setAllChecked: (checked) =>
    set((state) => ({
      lineItems: state.lineItems.map((item: LineItem) => ({
        ...item,
        checkedQty: checked ? parseFloat(item.quantity || "0") : 0
      }))
    })),

  reset: () =>
    set(() => ({
      isCountColumnVisible: false,
      lineItems: [initialLineItem()],
      originalLineItems: []
    }))
}));
