import { createContext, useContext } from "react";

export type ProtectedBillingAction = {
  save: () => Promise<void>;
  afterSave: () => void | Promise<void>;
  afterDiscard: () => void | Promise<void>;
  onStay?: () => void;
  origin?: HTMLElement | null;
};

type BillingPersistenceContextValue = {
  protect(action: ProtectedBillingAction): Promise<boolean>;
};

export const BillingPersistenceContext = createContext<BillingPersistenceContextValue | null>(null);

export function useBillingPersistenceGuard(): BillingPersistenceContextValue {
  const context = useContext(BillingPersistenceContext);
  if (!context) {
    throw new Error("Billing persistence actions require BillingPersistenceGuard.");
  }
  return context;
}
