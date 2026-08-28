import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";

type ViewModalStoreType = {
  isViewModalOpen: boolean;
  setIsViewModalOpen: (value: boolean) => void;
  transactionId: string;
  setTransactionId: (id: string) => void;
  transactionType: DashboardType;
  setTransactionType: (type: DashboardType) => void;
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
        ),

      transactionType: DASHBOARD_TYPE.SALES,
      setTransactionType: (type) =>
        set(
          () => ({
            transactionType: type
          }),
          false,
          "viewModal/setTransactionType"
        )
    }),
    { name: "view-modal-store" }
  )
);
