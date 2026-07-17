import { apiClient } from "@/lib/apiClient";
import type { PrefillCustomer } from "@/store/billing/billingSession.types";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const useInitialBillingData = (
  formattedType: TransactionType,
  activeTabId: string | null,
  id?: string,
  prefillCustomer?: PrefillCustomer | null
) => {
  const updateField = useBillingSessionStore((state) => state.updateField);

  const shouldFetch =
    !id &&
    !prefillCustomer &&
    (formattedType === TRANSACTION_TYPE.SALE || formattedType === TRANSACTION_TYPE.ESTIMATE);

  const {
    data: customerData,
    isFetched: isCustomerFetched,
    isError: isCustomerError,
    error: customerError
  } = useQuery({
    queryKey: ["defaultCustomer"],
    queryFn: () => apiClient.get<Customer>("/api/customers/default"),
    enabled: shouldFetch
  });

  // apply prefilled customer (e.g. "Add Sale" from a customer workspace)
  useEffect(() => {
    if (!activeTabId || !prefillCustomer || id) return;
    const session = useBillingSessionStore.getState().sessions[activeTabId];
    if (!session || session.customerId) return;
    updateField(activeTabId, "customerId", prefillCustomer.id);
    updateField(activeTabId, "customerName", prefillCustomer.name);
  }, [activeTabId, prefillCustomer, id, updateField]);

  useEffect(() => {
    if (!activeTabId) return;
    if (!isCustomerFetched || !customerData) {
      return;
    }
    // don't overwrite an already assigned customer (prefill or manual selection)
    const session = useBillingSessionStore.getState().sessions[activeTabId];
    if (!session || session.customerId) return;
    updateField(activeTabId, "customerId", customerData.id);
    updateField(activeTabId, "customerName", customerData.name);
  }, [customerData, isCustomerFetched, activeTabId, updateField]);

  useEffect(() => {
    if (isCustomerError) {
      toast.error(`Failed to load default customer: ${customerError.message}`);
    }
  }, [isCustomerError, customerError]);
};
