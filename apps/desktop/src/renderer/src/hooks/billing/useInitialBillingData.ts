import { apiClient } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const useInitialBillingData = (
  formattedType: TransactionType,
  activeTabId: string | null,
  id?: string
) => {
  const updateField = useBillingSessionStore((state) => state.updateField);

  const shouldFetch =
    !id && (formattedType === TRANSACTION_TYPE.SALE || formattedType === TRANSACTION_TYPE.ESTIMATE);

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

  useEffect(() => {
    if (!activeTabId) return;
    if (!isCustomerFetched || !customerData) {
      return;
    }
    updateField(activeTabId, "customerId", customerData.id);
    updateField(activeTabId, "customerName", customerData.name);
  }, [customerData, isCustomerFetched, activeTabId, updateField]);

  useEffect(() => {
    if (isCustomerError) {
      toast.error(`Failed to load default customer: ${customerError.message}`);
    }
  }, [isCustomerError, customerError]);
};
