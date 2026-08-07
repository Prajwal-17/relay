import { type Product, type ProductSortByType } from "@shared/types";
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
  setIsDropdownOpen: (isOpen: boolean) => void;
  sortBy: ProductSortByType | null;
  setSortBy: (sortBy: ProductSortByType | null) => void;
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
          (state) => ({
            activeRowId: rowIndex,
            sortBy: state.activeRowId !== rowIndex ? null : state.sortBy
          }),
          false,
          "searchDropdown/setActiveRowId"
        ),

      isDropdownOpen: false,
      setIsDropdownOpen: (isOpen) =>
        set(
          () => ({
            isDropdownOpen: isOpen
          }),
          false,
          "searchDropdown/setIsDropdownOpen"
        ),

      sortBy: null,
      setSortBy: (sortBy) =>
        set(
          () => ({
            sortBy
          }),
          false,
          "searchDropdown/setSortBy"
        ),

      reset: () =>
        set(
          () => ({
            itemQuery: "",
            availableProducts: [],
            activeRowId: null,
            isDropdownOpen: false,
            sortBy: null
          }),
          false,
          "searchDropdown/reset"
        )
    }),
    { name: "search-dropdown-store" }
  )
);
