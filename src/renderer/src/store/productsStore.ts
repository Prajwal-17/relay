import type { ProductsType } from "src/shared/types";
import { create } from "zustand";

type ProductsStoreType = {
  openProductDialog: boolean;
  setOpenProductDialog: () => void;
  actionType: "add" | "edit";
  setActionType: (action: "add" | "edit") => void;
  searchResult: ProductsType[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: ProductsType[]) => void;
};

export const useProductsStore = create<ProductsStoreType>((set) => ({
  openProductDialog: false,
  setOpenProductDialog: () =>
    set((state) => ({
      openProductDialog: !state.openProductDialog
    })),
  actionType: "add",
  setActionType: (action) =>
    set(() => ({
      actionType: action
    })),
  searchResult: [],
  setSearchResult: (mode, newResult) =>
    set((state) => {
      if (mode === "append") {
        return {
          searchResult: [...state.searchResult, ...newResult]
        };
      } else {
        return {
          searchResult: newResult
        };
      }
    })
}));
