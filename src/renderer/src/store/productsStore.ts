import type { ProductsType } from "src/shared/types";
import { create } from "zustand";

export type ProductsFormType = Omit<ProductsType, "price"> & {
  price: string;
};

type ProductsStoreType = {
  openProductDialog: boolean;
  setOpenProductDialog: () => void;
  actionType: "add" | "edit" | "billing-page-edit";
  setActionType: (action: "add" | "edit" | "billing-page-edit") => void;
  searchParam: string;
  setSearchParam: (param: string) => void;
  searchResult: ProductsType[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: ProductsType[]) => void;
  formDataState: ProductsFormType;
  setFormDataState: (data: Partial<ProductsFormType>) => void;
  errors: Record<string, string>;
  setErrors: (errObj: Record<string, string>) => void;
};

function initialFormData() {
  return {
    id: "",
    name: "",
    weight: null,
    unit: null,
    mrp: null,
    price: "",
    purchasePrice: null,
    isDisabled: false
  };
}

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

  searchParam: "",
  setSearchParam: (param) =>
    set(() => ({
      searchParam: param
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

  formDataState: initialFormData(),
  setFormDataState: (data) =>
    set((state) => {
      if (Object.keys(data).length === 0) {
        return {
          formDataState: initialFormData()
        };
      }

      return {
        formDataState: { ...state.formDataState, ...data }
      };
    }),

  errors: {},
  setErrors: (errObj) =>
    set(() => ({
      errors: { ...errObj }
    }))
}));
