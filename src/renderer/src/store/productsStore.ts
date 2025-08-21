import type { ProductsType } from "src/shared/types";
import { create } from "zustand";

type ProductsStoreType = {
  searchResult: ProductsType[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: ProductsType[]) => void;
};

export const useProductsStore = create<ProductsStoreType>((set) => ({
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
