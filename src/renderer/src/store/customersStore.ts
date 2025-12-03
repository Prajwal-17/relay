import { TRANSACTION_TYPE, type CustomersType, type TransactionType } from "@shared/types";
import { create } from "zustand";

type CustomersStoreType = {
  filterType: TransactionType;
  setFilterType: (newType: TransactionType) => void;
  openCustomerDialog: boolean;
  setOpenCustomerDialog: () => void;
  actionType: "add" | "edit";
  setActionType: (action: "add" | "edit") => void;
  selectedCustomer: CustomersType | null;
  setSelectedCustomer: (customer: CustomersType | null) => void;
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  formData: CustomersType;
  setFormData: (data: Partial<CustomersType>) => void;
};

function initialFormData() {
  return {
    id: "",
    name: "",
    contact: null,
    customerType: "cash"
  };
}

export const useCustomerStore = create<CustomersStoreType>((set) => ({
  filterType: TRANSACTION_TYPE.SALE,
  setFilterType: (newType) =>
    set(() => ({
      filterType: newType
    })),

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

  customerSearch: "",
  setCustomerSearch: (customer) =>
    set(() => ({
      customerSearch: customer
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
