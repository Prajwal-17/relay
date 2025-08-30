import type { CustomersType, FilteredGoogleContactsType } from "@shared/types";
import { create } from "zustand";

type CustomersStoreType = {
  loading: boolean;
  setLoading: () => void;
  refreshState: boolean;
  setRefreshState: (value: boolean) => void;
  openCustomerDialog: boolean;
  setOpenCustomerDialog: () => void;
  openContactDialog: boolean;
  setOpenContactDialog: () => void;
  actionType: "add" | "edit";
  setActionType: (action: "add" | "edit") => void;
  selectedCustomer: CustomersType | null;
  setSelectedCustomer: (customer: CustomersType | null) => void;
  formData: CustomersType;
  setFormData: (data: Partial<CustomersType>) => void;
  googleContacts: FilteredGoogleContactsType[] | [];
  setGoogleContacts: (contactArray: FilteredGoogleContactsType[] | []) => void;
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
  loading: false,
  setLoading: () =>
    set((state) => ({
      loading: !state.loading
    })),

  refreshState: false,
  setRefreshState: (value) =>
    set(() => ({
      refreshState: value
    })),

  openCustomerDialog: false,
  setOpenCustomerDialog: () =>
    set((state) => ({
      openCustomerDialog: !state.openCustomerDialog
    })),

  openContactDialog: false,
  setOpenContactDialog: () =>
    set((state) => ({
      openContactDialog: !state.openContactDialog
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
    }),

  googleContacts: [],
  setGoogleContacts: (contactArray) =>
    set(() => ({
      googleContacts: contactArray
    }))
}));
