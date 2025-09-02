import type { ProductsType } from "src/shared/types";
import { create } from "zustand";

type ProductsStoreType = {
  openProductDialog: boolean;
  setOpenProductDialog: () => void;
  actionType: "add" | "edit" | "billing-page-edit";
  setActionType: (action: "add" | "edit" | "billing-page-edit") => void;
  searchParam: string;
  setSearchParam: (param: string) => void;
  searchResult: ProductsType[] | [];
  setSearchResult: (mode: "append" | "replace", newResult: ProductsType[]) => void;
  formData: ProductsType;
  setFormData: (data: Partial<ProductsType>) => void;
};

function initialFormData() {
  return {
    id: "",
    name: "",
    weight: null,
    unit: null,
    mrp: null,
    price: 0,
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

  formData: initialFormData(),
  setFormData: (data) =>
    set((state) => {
      if (Object.keys(data).length === 0) {
        return {
          formData: initialFormData()
        };
      }

      return {
        formData: { ...state.formData, ...data }
      };
    })
}));
