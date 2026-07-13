import { createContext, useContext, type ReactNode } from "react";

export type CustomerActions = {
  openAddForm: () => void;
  openEditForm: () => void;
  openPayment: () => void;
  openAdjust: () => void;
  openQuickSale: () => void;
  openSearch: () => void;
};

const CustomerActionsContext = createContext<CustomerActions | null>(null);

export function CustomerActionsProvider({
  value,
  children
}: {
  value: CustomerActions;
  children: ReactNode;
}) {
  return (
    <CustomerActionsContext.Provider value={value}>{children}</CustomerActionsContext.Provider>
  );
}

export function useCustomerActions(): CustomerActions {
  const context = useContext(CustomerActionsContext);
  if (context === null) {
    throw new Error("useCustomerActions must be used within a CustomerActionsProvider");
  }
  return context;
}
