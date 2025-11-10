import { create } from "zustand";

type ViewModalStoreType = {
  isViewModalOpen: boolean;
  setIsViewModalOpen: (value: boolean) => void;
  transactionId: string;
  setTransactionId: (id: string) => void;
};

export const useViewModalStore = create<ViewModalStoreType>((set) => ({
  isViewModalOpen: false,
  setIsViewModalOpen: (value) =>
    set(() => ({
      isViewModalOpen: value
    })),

  transactionId: "",
  setTransactionId: (id) =>
    set(() => ({
      transactionId: id
    }))
}));
