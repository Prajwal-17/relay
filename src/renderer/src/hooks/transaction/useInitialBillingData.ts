import { apiClient } from "@/lib/apiClient";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useBillingSessionStore } from "@/store/billing/useBillingSessionStore";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const useInitialBillingData = (
  formattedType: TransactionType,
  activeTabId: string | null,
  id?: string
) => {
  const updateField = useBillingSessionStore((state) => state.updateField);

  const shouldFetch =
    !id && (formattedType === TRANSACTION_TYPE.SALE || formattedType === TRANSACTION_TYPE.ESTIMATE);

  const {
    data: transactionData,
    isFetched: isTransactionFetched,
    isError: isTransactionError,
    error: transactionError
  } = useQuery({
    queryKey: [formattedType, "getTransactionNo"],
    queryFn: () => apiClient.get<{ nextNo: number }>(`/api/${formattedType}s/next-number`),
    enabled: shouldFetch
  });

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
    if (!isTransactionFetched || !transactionData) {
      return;
    }
    const currentSession = useBillingSessionStore.getState().sessions[activeTabId];
    if (!currentSession || currentSession.transactionNo !== null) return;

    const tabs = useBillingTabsStore.getState().tabs;
    const maxNoInOpenTabs = tabs
      .filter((tab) => tab.type === formattedType && tab.transactionNo !== null)
      .reduce((max, tab) => Math.max(max, tab.transactionNo ?? 0), 0);

    updateField(activeTabId, "transactionNo", Math.max(transactionData.nextNo, maxNoInOpenTabs));
  }, [transactionData, isTransactionFetched, activeTabId, formattedType, updateField]);

  useEffect(() => {
    if (!activeTabId) return;
    if (!isCustomerFetched || !customerData) {
      return;
    }
    updateField(activeTabId, "customerId", customerData.id);
    updateField(activeTabId, "customerName", customerData.name);
  }, [customerData, isCustomerFetched, activeTabId, updateField]);

  useEffect(() => {
    if (isTransactionError) {
      toast.error(transactionError.message);
    }
  }, [isTransactionError, transactionError]);

  useEffect(() => {
    if (isCustomerError) {
      toast.error(`Failed to load default customer: ${customerError.message}`);
    }
  }, [isCustomerError, customerError]);
};

export default useInitialBillingData;
