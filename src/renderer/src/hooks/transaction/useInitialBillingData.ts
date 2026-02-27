import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const useInitialBillingData = (formattedType: TransactionType, id?: string) => {
  const setTransactionNo = useBillingStore((state) => state.setTransactionNo);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const setOriginalCustomerId = useBillingStore((state) => state.setOriginalCustomerId);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);

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
    if (!isTransactionFetched || !transactionData) {
      return;
    }
    setTransactionNo(transactionData.nextNo);
  }, [transactionData, setTransactionNo, isTransactionFetched]);

  useEffect(() => {
    if (!isCustomerFetched || !customerData) {
      return;
    }
    setCustomerId(customerData.id);
    setOriginalCustomerId(customerData.id);
    setCustomerName(customerData.name);
  }, [customerData, setCustomerId, setOriginalCustomerId, isCustomerFetched, setCustomerName]);

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
