import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ReceiptRefStoreType = {
  refs: Record<string, React.RefObject<HTMLDivElement>>;
  setReceiptRef: (tabId: string, ref: React.RefObject<HTMLDivElement>) => void;
  removeReceiptRef: (tabId: string) => void;
  getReceiptRef: (tabId: string) => React.RefObject<HTMLDivElement> | null;
};

export const useReceiptRefStore = create<ReceiptRefStoreType>()(
  devtools(
    (set, get) => ({
      refs: {},

      setReceiptRef: (tabId, ref) =>
        set(
          (state) => ({ refs: { ...state.refs, [tabId]: ref } }),
          false,
          "receiptRef/setReceiptRef"
        ),

      removeReceiptRef: (tabId) =>
        set(
          (state) => {
            // eslint-disable-next-line
            const { [tabId]: _, ...rest } = state.refs;
            return { refs: rest };
          },
          false,
          "receiptRef/removeReceiptRef"
        ),

      getReceiptRef: (tabId) => get().refs[tabId] ?? null
    }),
    { name: `(Do not open)Receipt-ref-store`, enabled: false } // crashes redux devtools when selected
  )
);
