import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ReceiptRefStoreType = {
  receiptRef: React.RefObject<HTMLDivElement> | null;
  setReceiptRef: (ref: React.RefObject<HTMLDivElement>) => void;
};

export const useReceiptRefStore = create<ReceiptRefStoreType>()(
  devtools(
    (set) => ({
      receiptRef: null,
      setReceiptRef: (ref) => set({ receiptRef: ref }, false, "receiptRef/setReceiptRef")
    }),
    { name: "receipt-ref-store" }
  )
);
