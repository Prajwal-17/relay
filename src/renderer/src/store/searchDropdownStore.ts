import type { ProductsType } from "src/shared/types";
import { create } from "zustand";

type SearchDropdownStoreType = {
  searchParam: string;
  setSearchParam: (query: string) => void;
  searchResult: ProductsType[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: ProductsType[]) => void;
  searchRow: number | null;
  setSearchRow: (rowIndex: number | null) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: () => void;
};

export const useSearchDropdownStore = create<SearchDropdownStoreType>((set) => ({
  searchParam: "",
  setSearchParam: (query) =>
    set(() => ({
      searchParam: query
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
    }),

  searchRow: null,
  setSearchRow: (rowIndex) =>
    set(() => ({
      searchRow: rowIndex
    })),

  isDropdownOpen: false,
  setIsDropdownOpen: () =>
    set((state) => ({
      isDropdownOpen: !state.isDropdownOpen
    }))
}));
