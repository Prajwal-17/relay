import type { Product } from "src/shared/types";
import { create } from "zustand";

type SearchDropdownStoreType = {
  itemQuery: string;
  setItemQuery: (query: string) => void;
  availableProducts: Product[] | [];
  setAvailableProducts: (mode: "append" | "replace", newResult: Product[]) => void;
  activeRowId: string | null;
  setActiveRowId: (rowId: string | null) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: () => void;
  reset: () => void;
};

export const useSearchDropdownStore = create<SearchDropdownStoreType>((set) => ({
  itemQuery: "",
  setItemQuery: (query) =>
    set(() => ({
      itemQuery: query
    })),

  availableProducts: [],
  setAvailableProducts: (mode, newResult) =>
    set((state) => {
      if (mode === "append") {
        return {
          availableProducts: [...state.availableProducts, ...newResult]
        };
      } else {
        return {
          availableProducts: newResult
        };
      }
    }),

  activeRowId: null,
  setActiveRowId: (rowIndex) =>
    set(() => ({
      activeRowId: rowIndex
    })),

  isDropdownOpen: false,
  setIsDropdownOpen: () =>
    set((state) => ({
      isDropdownOpen: !state.isDropdownOpen
    })),

  reset: () =>
    set(() => ({
      itemQuery: "",
      availableProducts: [],
      activeRowId: null,
      isDropDownOpen: false
    }))
}));
