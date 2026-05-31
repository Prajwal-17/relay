import {
  ACTION_TYPE,
  DIALOG_MODE,
  INITIAL_TAB,
  PRODUCT_FILTER,
  type ActionType,
  type DialogMode,
  type InitialTab,
  type Product,
  type ProductFilterType
} from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type ProductsFormType = Omit<
  Product,
  "id" | "price" | "productSnapshot" | "totalQuantitySold" | "mrp" | "purchasePrice"
> & {
  mrp: string | null;
  price: string;
  purchasePrice: string | null;
  isDeleted: boolean;
  imageUrl?: string | null;
  pendingImageBlob?: Blob | null;
  pendingImagePreviewUrl?: string | null;
  lastSoldAt?: string | null;
  totalQuantitySold?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type ProductsStoreType = {
  // search bar, filter & sort
  filterType: ProductFilterType;
  setFilterType: (newType: ProductFilterType) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  priceMin: string | null;
  setPriceMin: (val: string | null) => void;
  priceMax: string | null;
  setPriceMax: (val: string | null) => void;
  hasMrp: boolean;
  toggleMrpFilter: () => void;
  hasPurchasePrice: boolean;
  togglePurchasePriceFilter: () => void;
  activeFilters: { key: string; label: string; value: string }[];
  setActiveFilters: (filters: { key: string; label: string; value: string }[]) => void;
  removeActiveFilter: (key: string) => void;
  clearActiveFilters: () => void;
  openProductDialog: boolean;
  searchParam: string;
  setSearchParam: (param: string) => void;
  searchResult: Product[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: Product[]) => void;

  // product dialog state
  setOpenProductDialog: () => void;
  dialogMode: DialogMode;
  setDialogMode: (mode: DialogMode) => void;
  initialTab: InitialTab;
  setInitialTab: (tab: InitialTab) => void;
  actionType: ActionType;
  setActionType: (action: ActionType) => void;
  // product dialog form
  productId: string | null;
  setProductId: (id: string | null) => void;
  formDataState: ProductsFormType;
  setFormDataState: (data: Partial<ProductsFormType>) => void;
  dirtyFields: Partial<ProductsFormType>;
  setDirtyFields: (data: Partial<ProductsFormType>) => void;
  errors: Record<string, string>;
  setErrors: (errObj: Record<string, string>) => void;
};

function initialFormData(): ProductsFormType {
  return {
    name: "",
    weight: null,
    unit: null,
    mrp: null,
    price: "",
    purchasePrice: null,
    isDisabled: false,
    isDeleted: false,
    imageUrl: null,
    pendingImageBlob: null,
    pendingImagePreviewUrl: null,
    lastSoldAt: null,
    totalQuantitySold: null,
    createdAt: undefined,
    updatedAt: undefined,
    deletedAt: null,
    disabledAt: null
  };
}

export const useProductsStore = create<ProductsStoreType>()(
  devtools(
    (set) => ({
      filterType: PRODUCT_FILTER.ACTIVE,
      setFilterType: (newType) =>
        set(
          () => ({
            filterType: newType
          }),
          false,
          "products/setFilterType"
        ),

      sortBy: "",
      setSortBy: (sort) =>
        set(
          () => ({
            sortBy: sort
          }),
          false,
          "products/setSortBy"
        ),

      priceMin: null,
      setPriceMin: (val) =>
        set(
          () => ({
            priceMin: val
          }),
          false,
          "products/setPriceMin"
        ),

      priceMax: null,
      setPriceMax: (val) =>
        set(
          () => ({
            priceMax: val
          }),
          false,
          "products/setPriceMax"
        ),

      hasMrp: false,
      toggleMrpFilter: () =>
        set(
          (state) => ({
            hasMrp: !state.hasMrp
          }),
          false,
          "products/toggleMrpFilter"
        ),

      hasPurchasePrice: false,
      togglePurchasePriceFilter: () =>
        set(
          (state) => ({
            hasPurchasePrice: !state.hasPurchasePrice
          }),
          false,
          "products/togglePurchasePriceFilter"
        ),

      activeFilters: [],
      setActiveFilters: (filters) =>
        set(
          () => ({
            activeFilters: filters
          }),
          false,
          "products/setActiveFilters"
        ),
      removeActiveFilter: (key) =>
        set(
          (state) => ({
            activeFilters: state.activeFilters.filter((f) => f.key !== key)
          }),
          false,
          "products/removeActiveFilter"
        ),
      clearActiveFilters: () =>
        set(
          () => ({
            activeFilters: []
          }),
          false,
          "products/clearActiveFilters"
        ),

      openProductDialog: false,
      setOpenProductDialog: () =>
        set(
          (state) => ({
            openProductDialog: !state.openProductDialog
          }),
          false,
          "products/setOpenProductDialog"
        ),

      dialogMode: DIALOG_MODE.EDIT,
      setDialogMode: (mode) =>
        set(
          () => ({
            dialogMode: mode
          }),
          false,
          "products/setDialogMode"
        ),

      initialTab: INITIAL_TAB.INFO,
      setInitialTab: (tab) =>
        set(
          () => ({
            initialTab: tab
          }),
          false,
          "products/setInitialTab"
        ),

      actionType: ACTION_TYPE.ADD,
      setActionType: (action) =>
        set(
          () => ({
            actionType: action
          }),
          false,
          "products/setActionType"
        ),

      searchParam: "",
      setSearchParam: (param) =>
        set(
          () => ({
            searchParam: param
          }),
          false,
          "products/setSearchParam"
        ),

      searchResult: [],
      setSearchResult: (mode, newResult) =>
        set(
          (state) => {
            if (mode === "append") {
              return {
                searchResult: [...state.searchResult, ...newResult]
              };
            } else {
              return {
                searchResult: newResult
              };
            }
          },
          false,
          "products/setSearchResult"
        ),

      productId: null,
      setProductId: (id) =>
        set(
          () => ({
            productId: id
          }),
          false,
          "products/setProductId"
        ),

      formDataState: initialFormData(),
      setFormDataState: (data) =>
        set(
          (state) => ({
            formDataState:
              Object.keys(data).length === 0
                ? initialFormData()
                : { ...state.formDataState, ...data }
          }),
          false,
          "products/setFormDataState"
        ),

      dirtyFields: {},
      setDirtyFields: (data) =>
        set(
          (state) => {
            if (Object.keys(data).length === 0) {
              return {
                dirtyFields: {}
              };
            }

            return {
              dirtyFields: { ...state.dirtyFields, ...data }
            };
          },
          false,
          "products/setDirtyFields"
        ),

      errors: {},
      setErrors: (errObj) =>
        set(
          () => ({
            errors: { ...errObj }
          }),
          false,
          "products/setErrors"
        )
    }),
    { name: "products-store" }
  )
);
