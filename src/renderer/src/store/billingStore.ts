import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { create } from "zustand";

type Status = "idle" | "saving" | "saved" | "unsaved" | "error";

type BillingStore = {
  billingId: string | null; // sales.id | estimates.id
  setBillingId: (newId: string | null) => void;
  billingType: TransactionType;
  setBillingType: (type: TransactionType) => void;
  transactionNo: number | null;
  setTransactionNo: (newTransactionNo: number | null) => void;
  billingDate: Date;
  setBillingDate: (newDate: Date) => void;
  customerId: string | null;
  setCustomerId: (id: string | null) => void;
  customerName: string;
  setCustomerName: (newCustomerName: string) => void;
  customerContact: string | null;
  setCustomerContact: (newCustomerContact: string | null) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (value: boolean) => void;
  status: Status;
  setStatus: (newStatus: Status) => void;
};

export const useBillingStore = create<BillingStore>((set) => ({
  billingId: null, // sales.id || estimates.id
  setBillingId: (newId) =>
    set(() => ({
      billingId: newId
    })),

  transactionNo: null,
  setTransactionNo: (newTransactionNo) => set(() => ({ transactionNo: newTransactionNo })),

  billingType: TRANSACTION_TYPE.SALE,
  setBillingType: (type: TransactionType) =>
    set(() => ({
      billingType: type
    })),

  customerId: null,
  setCustomerId: (id) =>
    set(() => ({
      customerId: id
    })),

  customerName: "",
  setCustomerName: (newCustomerName) => set(() => ({ customerName: newCustomerName })),

  customerContact: "",
  setCustomerContact: (newCustomerContact) => set({ customerContact: newCustomerContact }),

  isNewCustomer: true,
  setIsNewCustomer: (value) =>
    set(() => ({
      isNewCustomer: value
    })),

  billingDate: new Date(),
  setBillingDate: (newDate) =>
    set(() => ({
      billingDate: newDate
    })),

  status: "idle",
  setStatus: (newStatus) =>
    set(() => ({
      status: newStatus
    }))
}));
