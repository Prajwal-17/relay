import { shouldAutomaticallyAddSaleToAccounting } from "@/features/billing/billingAccounting";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { apiClient } from "@/lib/apiClient";
import type { PrefillCustomer } from "@/features/billing/store/billingSession.types";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useInitialBillingData = (
  formattedType: TransactionType,
  activeTabId: string | null,
  id?: string,
  prefillCustomer?: PrefillCustomer | null
) => {
  const hydrateSession = useBillingSessionStore((state) => state.hydrateSession);
  const { config, isError: isPreferencesError } = useAppPreferences();
  const preferencesReady = Boolean(config) || isPreferencesError;
  const autoAddAccountCustomerSales = config?.billing.autoAddAccountCustomerSales ?? false;
  const defaultCustomerId = config?.billing.defaultCustomerId ?? null;

  const shouldFetch =
    !id &&
    !prefillCustomer &&
    (formattedType === TRANSACTION_TYPE.SALE || formattedType === TRANSACTION_TYPE.ESTIMATE);

  const {
    data: customerData,
    isFetched: isCustomerFetched,
    isError: isCustomerError,
    error: customerError,
    refetch: refetchCustomer,
    isFetching: isCustomerFetching
  } = useQuery({
    queryKey: ["defaultCustomer"],
    queryFn: () => apiClient.get<Customer>("/api/customers/default"),
    enabled: shouldFetch
  });

  // apply prefilled customer (e.g. "Add Sale" from a customer workspace)
  useEffect(() => {
    if (!activeTabId || !prefillCustomer || id || !preferencesReady) return;
    const session = useBillingSessionStore.getState().sessions[activeTabId];
    if (!session || session.customerId) return;
    hydrateSession(activeTabId, {
      customerId: prefillCustomer.id,
      customerName: prefillCustomer.name,
      addToAccounting: shouldAutomaticallyAddSaleToAccounting({
        billingType: formattedType,
        customer: prefillCustomer,
        defaultCustomerId,
        enabled: autoAddAccountCustomerSales
      })
    });
  }, [
    activeTabId,
    prefillCustomer,
    id,
    hydrateSession,
    preferencesReady,
    formattedType,
    defaultCustomerId,
    autoAddAccountCustomerSales
  ]);

  useEffect(() => {
    if (!activeTabId) return;
    if (!isCustomerFetched || !customerData) {
      return;
    }
    // don't overwrite an already assigned customer (prefill or manual selection)
    const session = useBillingSessionStore.getState().sessions[activeTabId];
    if (!session || session.customerId) return;
    hydrateSession(activeTabId, {
      customerId: customerData.id,
      customerName: customerData.name
    });
  }, [customerData, isCustomerFetched, activeTabId, hydrateSession]);

  return {
    isCustomerError,
    customerError,
    refetchCustomer,
    isCustomerFetching
  };
};
