import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { type Product, type ProductSortByType } from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type SearchDropdownDraft = {
  itemQuery: string;
  activeRowId: string | null;
  isDropdownOpen: boolean;
  sortBy: ProductSortByType | null;
};

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
  draftsByTab: Record<string, SearchDropdownDraft>;
  getDraft: (tabId: string) => SearchDropdownDraft | null;
  reset: () => void;
};

function updateActiveTabDraft(
  state: SearchDropdownStoreType,
  updates: Partial<SearchDropdownDraft>
): Record<string, SearchDropdownDraft> {
  const tabId = useBillingTabsStore.getState().activeTabId;
  if (!tabId) return state.draftsByTab;
  return {
    ...state.draftsByTab,
    [tabId]: {
      itemQuery: state.itemQuery,
      activeRowId: state.activeRowId,
      isDropdownOpen: state.isDropdownOpen,
      sortBy: state.sortBy,
      ...updates
    }
  };
}

export const useSearchDropdownStore = create<SearchDropdownStoreType>()(
  devtools(
    (set, get) => ({
      itemQuery: "",
      setItemQuery: (query) =>
        set(
          (state) => ({
            itemQuery: query,
            draftsByTab: updateActiveTabDraft(state, { itemQuery: query })
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
      setActiveRowId: (rowId) =>
        set(
          (state) => ({
            activeRowId: rowId,
            sortBy: state.activeRowId !== rowId ? null : state.sortBy,
            draftsByTab: updateActiveTabDraft(state, {
              activeRowId: rowId,
              sortBy: state.activeRowId !== rowId ? null : state.sortBy
            })
          }),
          false,
          "searchDropdown/setActiveRowId"
        ),

      isDropdownOpen: false,
      setIsDropdownOpen: (isOpen) =>
        set(
          (state) => ({
            isDropdownOpen: isOpen,
            draftsByTab: updateActiveTabDraft(state, { isDropdownOpen: isOpen })
          }),
          false,
          "searchDropdown/setIsDropdownOpen"
        ),

      sortBy: null,
      setSortBy: (sortBy) =>
        set(
          (state) => ({
            sortBy,
            draftsByTab: updateActiveTabDraft(state, { sortBy })
          }),
          false,
          "searchDropdown/setSortBy"
        ),

      draftsByTab: {},
      getDraft: (tabId) => get().draftsByTab[tabId] ?? null,

      reset: () =>
        set(
          () => ({
            itemQuery: "",
            availableProducts: [],
            activeRowId: null,
            isDropdownOpen: false,
            sortBy: null,
            draftsByTab: {}
          }),
          false,
          "searchDropdown/reset"
        )
    }),
    { name: "search-dropdown-store" }
  )
);

useBillingTabsStore.subscribe((state, previousState) => {
  if (state.activeTabId === previousState.activeTabId) return;
  const draft = state.activeTabId
    ? useSearchDropdownStore.getState().draftsByTab[state.activeTabId]
    : undefined;
  useSearchDropdownStore.setState({
    itemQuery: draft?.itemQuery ?? "",
    availableProducts: [],
    activeRowId: draft?.activeRowId ?? null,
    isDropdownOpen: draft?.isDropdownOpen ?? false,
    sortBy: draft?.sortBy ?? null
  });
});
