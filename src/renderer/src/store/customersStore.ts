import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type CustomersStoreType = {
  filterType: TransactionType;
  setFilterType: (newType: TransactionType) => void;
  openCustomerDialog: boolean;
  setOpenCustomerDialog: () => void;
  actionType: "add" | "edit";
  setActionType: (action: "add" | "edit") => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  formData: Customer;
  setFormData: (data: Partial<Customer>) => void;
};

function initialFormData() {
  return {
    id: "",
    name: "",
    contact: null,
    customerType: "cash"
  };
}

export const useCustomerStore = create<CustomersStoreType>()(
  devtools(
    (set) => ({
      filterType: TRANSACTION_TYPE.SALE,
      setFilterType: (newType) =>
        set(
          () => ({
            filterType: newType
          }),
          false,
          "customers/setFilterType"
        ),

      openCustomerDialog: false,
      setOpenCustomerDialog: () =>
        set(
          (state) => ({
            openCustomerDialog: !state.openCustomerDialog
          }),
          false,
          "customers/setOpenCustomerDialog"
        ),

      actionType: "add",
      setActionType: (action) =>
        set(
          () => ({
            actionType: action
          }),
          false,
          "customers/setActionType"
        ),

      selectedCustomer: null,
      setSelectedCustomer: (customer) =>
        set(
          () => ({
            selectedCustomer: customer
          }),
          false,
          "customers/setSelectedCustomer"
        ),

      customerSearch: "",
      setCustomerSearch: (customer) =>
        set(
          () => ({
            customerSearch: customer
          }),
          false,
          "customers/setCustomerSearch"
        ),

      formData: initialFormData(),
      setFormData: (data) =>
        set(
          (state) => {
            if (Object.keys(data).length === 0) {
              return {
                formData: initialFormData()
              };
            }

            return {
              formData: { ...state.formData, ...data }
            };
          },
          false,
          "customers/setFormData"
        )
    }),
    { name: "customers-store" }
  )
);
