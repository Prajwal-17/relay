import { createContext, useContext } from "react";

export type CustomerActions = {
  openAddForm: () => void;
  openEditForm: () => void;
  openPayment: () => void;
  openAdjust: () => void;
  openQuickSale: () => void;
  openSearch: () => void;
};

export const CustomerActionsContext = createContext<CustomerActions | null>(null);

export function useCustomerActions(): CustomerActions {
  const context = useContext(CustomerActionsContext);
  if (context === null) {
    throw new Error("useCustomerActions must be used within a CustomerActionsProvider");
  }
  return context;
}
