import type { ProductsType, UnifiedTransactionItem } from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

export type LineItem = {
  rowId: string;
  id: string | null;
  productId: string | null;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  quantity: number;
  totalPrice: number;
  checkedQty: number;
  isInventoryItem: boolean;
};

type LineItemsStore = {
  isCountColumnVisible: boolean;
  setIsCountControlsVisible: () => void;
  lineItems: LineItem[] | [];
  setLineItems: (itemsArray: UnifiedTransactionItem[]) => void;
  addEmptyLineItem: (type?: "button") => void;
  addLineItem: (index: number, newItem: ProductsType) => void;
  updateLineItem: (id: string, field: string, value: string | number) => void;
  deleteLineItem: (id: string) => void;
  setAllChecked: (checked: boolean) => void;
};

function initialLineItem() {
  const lineItem: LineItem = {
    rowId: uuidv4(),
    id: null,
    productId: null,
    name: "",
    productSnapshot: "",
    weight: null,
    unit: null,
    mrp: null,
    price: 0,
    purchasePrice: null,
    quantity: 0,
    totalPrice: 0,
    checkedQty: 0,
    isInventoryItem: false
  };

  return lineItem;
}

const reCalculateLineItem = (item: LineItem): LineItem => {
  const rawTotal = item.price * item.quantity;
  const totalPrice = Math.round(rawTotal);
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

  lineItems: [initialLineItem()],

  setLineItems: (itemsArray) =>
    set(() => {
      if (!itemsArray || itemsArray.length === 0) {
        return {
          lineItems: [initialLineItem()]
        };
      }

      const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
        rowId: uuidv4(),
        id: item.id,
        productId: item.productId,
        name: item.name,
        productSnapshot: item.productSnapshot,
        weight: item.weight,
        unit: item.unit,
        mrp: item.mrp,
        price: item.price,
        purchasePrice: item.purchasePrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        checkedQty: item.checkedQty,
        isInventoryItem: item.productId ? true : false
      }));

      return {
        lineItems: lineItemsArray
      };
    }),

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
  addLineItem: (index, newItem) =>
    set((state) => {
      /**
       * always create a new array to update the existing state array, coz react/zustand does
       * shallow comparison hence the array reference remains the same, so creating new array creates new reference
       * where react/zustand notices change
       */
      const currLineItems = [...state.lineItems];

      // existing line item at index
      const oldItem = currLineItems[index];
      const oldItemQuantity = oldItem.quantity > 1 ? oldItem.quantity : 1;
      const oldItemCheckedQty = oldItem.checkedQty > 1 ? oldItem.checkedQty : 0;

      const updatedItem: LineItem = {
        rowId: uuidv4(),
        id: null,
        productId: newItem.id,
        name: newItem.name,
        productSnapshot: newItem.productSnapshot,
        weight: newItem.weight,
        unit: newItem.unit,
        mrp: newItem.mrp,
        price: newItem.price,
        purchasePrice: newItem.purchasePrice,
        quantity: oldItemQuantity,
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

        const draftItem = {
          ...item,
          [field]: value
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

  // delete a row
  deleteLineItem: (id) =>
    set((state) => {
      const updatedLineItems = state.lineItems.filter((item) => item.rowId !== id);
      return {
        lineItems: updatedLineItems
      };
    }),

  setAllChecked: (checked) =>
    set((state) => ({
      lineItems: state.lineItems.map((item: LineItem) => ({
        ...item,
        checkedQty: checked ? item.quantity : 0
      }))
    }))
}));
