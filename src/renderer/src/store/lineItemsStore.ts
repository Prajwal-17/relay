import type { Product, UnifiedTransactionItem } from "@shared/types";
import { formatToRupees } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

export type LineItem = {
  // TODO
  // id: string, // saleItem.id || estimateItem.id
  // parentId: sale.id || estimate.id
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
  addEmptyLineItem: (type?: "button") => void;
  addLineItem: (rowId: string, newItem: Product) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string | number) => void;
  deleteLineItem: (id: string) => void;
  setAllChecked: (checked: boolean) => void;
};

function initialLineItem() {
  const lineItem: LineItem = {
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

  lineItems: [initialLineItem()],

  setLineItems: (itemsArray) =>
    set(() => {
      if (!itemsArray || itemsArray.length === 0) {
        return {
          lineItems: [initialLineItem()]
        };
      }

      const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
        // TODO
        // id: string, // saleItem.id || estimateItem.id
        // parentId: sale.id || estimate.id
        rowId: uuidv4(),
        id: item.id,
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
        checkedQty: checked ? parseFloat(item.quantity || "0") : 0
      }))
    }))
}));
