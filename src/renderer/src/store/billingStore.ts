import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { ProductsType } from "src/shared/types";

type LineItemsType = {
  id: string;
  productId: string;
  name: string;
  weight: string | null;
  unit: string | null;
  quantity: number;
  mrp: number | null;
  price: number;
  totalPrice: number;
};

type BillingStoreType = {
  billingId: string | null;
  setBillingId: (newId: string | null) => void;
  invoiceNo: number | null;
  setInvoiceNo: (newInvoiceNo: number | null) => void;
  customerName: string;
  setCustomerName: (newCustomerName: string) => void;
  customerContact: string | null;
  setCustomerContact: (newCustomerContact: string | null) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  lineItems: LineItemsType[] | [];
  setLineItems: (itemsArray: LineItemsType[]) => void;
  addEmptyLineItem: () => void;
  addLineItem: (index: number, newItem: ProductsType) => void;
  updateLineItems: (id: string, field: string, value: string | number) => void;
  deleteLineItem: (id: string) => void;
};

function initialLineItem() {
  return {
    id: uuidv4(),
    productId: "",
    name: "",
    weight: "",
    unit: "",
    quantity: 0,
    mrp: 0,
    price: 0,
    totalPrice: 0
  };
}

export const useBillingStore = create<BillingStoreType>((set) => ({
  billingId: null, // sales.id || estimates.id
  setBillingId: (newId) =>
    set(() => ({
      billingId: newId
    })),

  invoiceNo: null,
  setInvoiceNo: (newInvoiceNo) => set(() => ({ invoiceNo: newInvoiceNo })),

  customerName: "",
  setCustomerName: (newCustomerName) => set(() => ({ customerName: newCustomerName })),

  customerContact: "",
  setCustomerContact: (newCustomerContact) => set({ customerContact: newCustomerContact }),

  paymentMethod: "cash",
  setPaymentMethod: (method) =>
    set(() => ({
      paymentMethod: method
    })),

  lineItems: [initialLineItem()],

  setLineItems: (itemsArray) =>
    set(() => {
      if (!itemsArray || itemsArray.length === 0) {
        return {
          lineItems: [initialLineItem()]
        };
      }

      return {
        lineItems: itemsArray.map((item) => ({
          id: uuidv4(),
          productId: item.productId,
          name: item.name,
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          mrp: item.mrp,
          price: item.price,
          totalPrice: item.quantity * item.price
        }))
      };
    }),

  // add empty row
  addEmptyLineItem: () =>
    set((state) => ({
      lineItems: [...state.lineItems, initialLineItem()]
    })),

  // add new item on selection
  addLineItem: (index, newItem) =>
    set((state) => {
      /**
       * always create a new array to update the existing state array, coz react/zustand does
       * shallow comparison hence the array reference remains the same, so creating new array creates new reference
       * where react/zustand notices change
       */
      const currLineItems = [...state.lineItems];

      const updatedItem = {
        ...newItem,
        id: uuidv4(),
        productId: newItem.id,
        quantity: 1,
        totalPrice: parseFloat((1 * newItem.price).toFixed(2))
      };

      currLineItems[index] = { ...updatedItem };

      return {
        lineItems: currLineItems
      };
    }),

  // update on field change
  updateLineItems: (id, field, value) =>
    set((state) => {
      const updatedLineItems = state.lineItems.map((item: LineItemsType) => {
        if (id !== item.id) return item;

        const updatedItem = {
          ...item,
          [field]: field === "quantity" || field === "price" ? Number(value) : value
        };

        if (["quantity", "price"].includes(field)) {
          return {
            ...updatedItem,
            totalPrice: parseFloat((updatedItem.quantity * updatedItem.price).toFixed(2))
          };
        }
        return updatedItem;
      });

      return {
        lineItems: updatedLineItems
      };
    }),

  // delete a row
  deleteLineItem: (id) =>
    set((state) => {
      const updatedLineItems = state.lineItems.filter((item) => item.id !== id);
      return {
        lineItems: updatedLineItems
      };
    })
}));
