import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import {
  TRANSACTION_TYPE,
  type TransactionType,
  type UnifiedTransctionWithItems
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const useLoadTransactionDetails = (type: TransactionType, id?: string) => {
  // Billing store setters
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const setBillingType = useBillingStore((state) => state.setBillingType);
  const setTransactionNo = useBillingStore((state) => state.setTransactionNo);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);
  const setOriginalBillingDate = useBillingStore((state) => state.setOriginalBillingDate);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);

  // Line items store setters
  const setLineItems = useLineItemsStore((state) => state.setLineItems);
  const setOriginalLineItems = useLineItemsStore((state) => state.setOriginalLineItems);

  const { data, isSuccess, isLoading, status, isFetched, isError, error } = useQuery({
    queryKey: [type, id],
    queryFn: async () => apiClient.get<UnifiedTransctionWithItems>(`/api/${type}s/${id}`),
    enabled: !!id && (type === TRANSACTION_TYPE.SALE || type === TRANSACTION_TYPE.ESTIMATE)
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  useEffect(() => {
    if (isSuccess && data) {
      setBillingId(data.id);
      setBillingType(data.type);
      setTransactionNo(data.transactionNo);
      setBillingDate(new Date(data.createdAt as string));
      setOriginalBillingDate(new Date(data.createdAt as string));
      setCustomerId(data.customerId);
      setCustomerName(data.customer.name);
      setLineItems(data.items);
      setOriginalLineItems();
    }
  }, [
    isSuccess,
    data,
    setBillingId,
    setBillingType,
    setTransactionNo,
    setBillingDate,
    setOriginalBillingDate,
    setCustomerId,
    setCustomerName,
    setLineItems,
    setOriginalLineItems
  ]);
  return { status, isLoading, isFetched };
};

export default useLoadTransactionDetails;
