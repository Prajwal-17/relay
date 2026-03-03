import { PRODUCT_FILTER, type Product, type ProductFilterType } from "@shared/types";
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
};

type ProductsStoreType = {
  filterType: ProductFilterType;
  setFilterType: (newType: ProductFilterType) => void;
  openProductDialog: boolean;
  setOpenProductDialog: () => void;
  actionType: "add" | "edit" | "billing-page-edit";
  setActionType: (action: "add" | "edit" | "billing-page-edit") => void;
  searchParam: string;
  setSearchParam: (param: string) => void;
  searchResult: Product[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: Product[]) => void;
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
    isDeleted: false
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

      openProductDialog: false,
      setOpenProductDialog: () =>
        set(
          (state) => ({
            openProductDialog: !state.openProductDialog
          }),
          false,
          "products/setOpenProductDialog"
        ),

      actionType: "add",
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
