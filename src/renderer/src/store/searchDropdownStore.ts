import type { ProductsType } from "src/shared/types";
import { create } from "zustand";

// type SearchResultType = {
//   id: string;
//   name: string;
//   weight: string | null;
//   unit: string | null;
//   mrp: number | null;
//   price: number;
// };

// store

type SearchDropdownStoreType = {
  searchParam: string;
  setSearchParam: (query: string) => void;
  searchResult: ProductsType[] | [];
  setSearchResult: (mode: string, newResult: ProductsType[]) => void; // mode = "append" | "replace"
  searchRow: number | null;
  setSearchRow: (rowIndex: number) => void;
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
