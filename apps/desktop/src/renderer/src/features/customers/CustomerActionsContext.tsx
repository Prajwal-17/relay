import { type ReactNode } from "react";
import { CustomerActionsContext, type CustomerActions } from "./customerActions";

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
