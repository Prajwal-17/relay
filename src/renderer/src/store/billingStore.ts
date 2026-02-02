import { BILLSTATUS, TRANSACTION_TYPE, type BillStatus, type TransactionType } from "@shared/types";
import { create } from "zustand";

type BillingStore = {
  billingId: string | null; // sales.id | estimates.id
  setBillingId: (newId: string | null) => void;
  billingType: TransactionType;
  setBillingType: (type: TransactionType) => void;
  transactionNo: number | null;
  setTransactionNo: (newTransactionNo: number | null) => void;
  billingDate: Date;
  setBillingDate: (newDate: Date) => void;
  originalBillingDate: Date;
  setOriginalBillingDate: (newDate: Date) => void;
  customerId: string | null;
  setCustomerId: (id: string | null) => void;
  customerName: string;
  setCustomerName: (newCustomerName: string) => void;
  status: BillStatus;
  setStatus: (newStatus: BillStatus) => void;
  reset: () => void;
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

  billingDate: new Date(),
  setBillingDate: (newDate) =>
    set(() => ({
      billingDate: newDate
    })),

  originalBillingDate: new Date(),
  setOriginalBillingDate: (newDate) =>
    set(() => ({
      originalBillingDate: newDate
    })),

  status: BILLSTATUS.IDLE,
  setStatus: (newStatus) =>
    set(() => ({
      status: newStatus
    })),

  reset: () =>
    set(() => ({
      billingId: null,
      transactionNo: null,
      billingDate: new Date(),
      originalBillingDate: new Date(),
      customerId: null,
      customerName: "",
      isNewCustomer: true,
      status: BILLSTATUS.IDLE
    }))
}));
