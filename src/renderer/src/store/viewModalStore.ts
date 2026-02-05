import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ViewModalStoreType = {
  isViewModalOpen: boolean;
  setIsViewModalOpen: (value: boolean) => void;
  transactionId: string;
  setTransactionId: (id: string) => void;
};

export const useViewModalStore = create<ViewModalStoreType>()(
  devtools(
    (set) => ({
      isViewModalOpen: false,
      setIsViewModalOpen: (value) =>
        set(
          () => ({
            isViewModalOpen: value
          }),
          false,
          "viewModal/setIsViewModalOpen"
        ),

      transactionId: "",
      setTransactionId: (id) =>
        set(
          () => ({
            transactionId: id
          }),
          false,
          "viewModal/setTransactionId"
        )
    }),
    { name: "view-modal-store" }
  )
);
