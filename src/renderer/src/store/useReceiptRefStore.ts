import { create } from "zustand";

type ReceiptRefStoreType = {
  receiptRef: React.RefObject<HTMLDivElement> | null;
  setReceiptRef: (ref: React.RefObject<HTMLDivElement>) => void;
};

export const useReceiptRefStore = create<ReceiptRefStoreType>((set) => ({
  receiptRef: null,
  setReceiptRef: (ref) => set({ receiptRef: ref })
}));
