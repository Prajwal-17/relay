import type { Product } from "src/shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

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

export const useSearchDropdownStore = create<SearchDropdownStoreType>()(
  devtools(
    (set) => ({
      itemQuery: "",
      setItemQuery: (query) =>
        set(
          () => ({
            itemQuery: query
          }),
          false,
          "searchDropdown/setItemQuery"
        ),

      availableProducts: [],
      setAvailableProducts: (mode, newResult) =>
        set(
          (state) => {
            if (mode === "append") {
              return {
                availableProducts: [...state.availableProducts, ...newResult]
              };
            } else {
              return {
                availableProducts: newResult
              };
            }
          },
          false,
          "searchDropdown/setAvailableProducts"
        ),

      activeRowId: null,
      setActiveRowId: (rowIndex) =>
        set(
          () => ({
            activeRowId: rowIndex
          }),
          false,
          "searchDropdown/setActiveRowId"
        ),

      isDropdownOpen: false,
      setIsDropdownOpen: () =>
        set(
          (state) => ({
            isDropdownOpen: !state.isDropdownOpen
          }),
          false,
          "searchDropdown/setIsDropdownOpen"
        ),

      reset: () =>
        set(
          () => ({
            itemQuery: "",
            availableProducts: [],
            activeRowId: null,
            isDropDownOpen: false
          }),
          false,
          "searchDropdown/reset"
        )
    }),
    { name: "search-dropdown-store" }
  )
);
