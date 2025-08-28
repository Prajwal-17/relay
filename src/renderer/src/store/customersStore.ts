import type { CustomersType } from "@shared/types";
import { create } from "zustand";

type CustomersStoreType = {
  openCustomerDialog: boolean;
  setOpenCustomerDialog: () => void;
  selectedCustomer: string;
  setSelectedCustomer: (id: string) => void;
  formData: CustomersType;
  setFormData: (data: Partial<CustomersType>) => void;
};

function initialFormData() {
  return {
    id: "",
    name: "",
    contact: "",
    customerType: "cash"
  };
}

export const useCustomerStore = create<CustomersStoreType>((set) => ({
  openCustomerDialog: false,
  setOpenCustomerDialog: () =>
    set((state) => ({
      openCustomerDialog: !state.openCustomerDialog
    })),

  selectedCustomer: "",
  setSelectedCustomer: (id) =>
    set(() => ({
      selectedCustomer: id
    })),

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
