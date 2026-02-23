import { BILLSTATUS, TRANSACTION_TYPE, type BillStatus, type TransactionType } from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  isNewCustomer: boolean;
  setIsNewCustomer: (isNew: boolean) => void;
  originalCustomerId: string | null;
  setOriginalCustomerId: (id: string | null) => void;
  syncOriginals: () => void;
  status: BillStatus;
  setStatus: (newStatus: BillStatus) => void;
  reset: () => void;
};

export const useBillingStore = create<BillingStore>()(
  devtools(
    (set) => ({
      billingId: null, // sales.id || estimates.id
      setBillingId: (newId) =>
        set(
          () => ({
            billingId: newId
          }),
          false,
          "billing/setBillingId"
        ),

      transactionNo: null,
      setTransactionNo: (newTransactionNo) =>
        set(() => ({ transactionNo: newTransactionNo }), false, "billing/setTransactionNo"),

      billingType: TRANSACTION_TYPE.SALE,
      setBillingType: (type: TransactionType) =>
        set(
          () => ({
            billingType: type
          }),
          false,
          "billing/setBillingType"
        ),

      customerId: null,
      setCustomerId: (id) =>
        set(
          () => ({
            customerId: id
          }),
          false,
          "billing/setCustomerId"
        ),

      customerName: "",
      setCustomerName: (newCustomerName) =>
        set(() => ({ customerName: newCustomerName }), false, "billing/setCustomerName"),

      billingDate: new Date(),
      setBillingDate: (newDate) =>
        set(
          () => ({
            billingDate: newDate
          }),
          false,
          "billing/setBillingDate"
        ),

      originalBillingDate: new Date(),
      setOriginalBillingDate: (newDate) =>
        set(
          () => ({
            originalBillingDate: newDate
          }),
          false,
          "billing/setOriginalBillingDate"
        ),

      isNewCustomer: true,
      setIsNewCustomer: (isNew) =>
        set(() => ({ isNewCustomer: isNew }), false, "billing/setIsNewCustomer"),

      originalCustomerId: null,
      setOriginalCustomerId: (id: string | null) =>
        set(
          () => ({
            originalCustomerId: id
          }),
          false,
          "billing/setOriginalCustomerId"
        ),
      syncOriginals: () =>
        set(
          (state) => ({
            originalBillingDate: state.billingDate,
            originalCustomerId: state.customerId
          }),
          false,
          "billing/syncOriginals"
        ),

      status: BILLSTATUS.IDLE,
      setStatus: (newStatus) =>
        set(
          () => ({
            status: newStatus
          }),
          false,
          "billing/setStatus"
        ),

      reset: () =>
        set(
          () => ({
            billingId: null,
            transactionNo: null,
            billingDate: new Date(),
            originalBillingDate: new Date(),
            customerId: null,
            originalCustomerId: null,
            customerName: "",
            isNewCustomer: true,
            status: BILLSTATUS.IDLE
          }),
          false,
          "billing/reset"
        )
    }),
    { name: "billing-store" }
  )
);
