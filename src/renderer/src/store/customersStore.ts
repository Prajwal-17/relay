import type { CustomersType } from "@shared/types";
import { create } from "zustand";

type CustomersStoreType = {
  openCustomerDialog: boolean;
  setOpenCustomerDialog: () => void;
  actionType: "add" | "edit";
  setActionType: (action: "add" | "edit") => void;
  selectedCustomer: CustomersType | null;
  setSelectedCustomer: (customer: CustomersType) => void;
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

  actionType: "add",
  setActionType: (action) =>
    set(() => ({
      actionType: action
    })),

  selectedCustomer: null,
  setSelectedCustomer: (customer) =>
    set(() => ({
      selectedCustomer: customer
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
