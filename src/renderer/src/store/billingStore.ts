import { BILLSTATUS, TRANSACTION_TYPE, type BillStatus, type TransactionType } from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type BillingStore = {
  isMetaDataDirty: boolean;
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
  isNewCustomer: boolean;
  setIsNewCustomer: (isNew: boolean) => void;
  status: BillStatus;
  setStatus: (newStatus: BillStatus) => void;
  markMetaDataSynced: () => void;
  reset: () => void;
};

export const useBillingStore = create<BillingStore>()(
  devtools(
    (set) => ({
      isMetaDataDirty: false,

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
            customerId: id,
            isMetaDataDirty: true
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
            billingDate: newDate,
            isMetaDataDirty: true
          }),
          false,
          "billing/setBillingDate"
        ),

      isNewCustomer: true,
      setIsNewCustomer: (isNew) =>
        set(() => ({ isNewCustomer: isNew }), false, "billing/setIsNewCustomer"),

      status: BILLSTATUS.IDLE,
      setStatus: (newStatus) =>
        set(
          () => ({
            status: newStatus
          }),
          false,
          "billing/setStatus"
        ),

      markMetaDataSynced: () =>
        set(() => ({
          isMetaDataDirty: false
        })),

      reset: () =>
        set(
          () => ({
            isMetaDataDirty: false,
            billingId: null,
            transactionNo: null,
            billingDate: new Date(),
            customerId: null,
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
