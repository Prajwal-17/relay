import { apiClient } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/useBillingSessionStore";
import {
  TRANSACTION_TYPE,
  type TransactionType,
  type UnifiedTransctionWithItems
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const useLoadTransactionDetails = (
  type: TransactionType,
  id?: string,
  activeTabId?: string | null
) => {
  const { setLineItems, updateField } = useBillingSessionStore.getState();
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
    if (!activeTabId) return;
    if (isSuccess && data) {
      updateField(activeTabId, "billingId", data.id);
      updateField(activeTabId, "billingType", data.type);
      updateField(activeTabId, "transactionNo", data.transactionNo);
      updateField(activeTabId, "billingDate", new Date(data.createdAt as string));
      updateField(activeTabId, "customerId", data.customerId);
      updateField(activeTabId, "customerName", data.customer.name);
      console.log(data.items);
      setLineItems(activeTabId, data.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data, activeTabId]);
  return { status, isLoading, isFetched };
};

export default useLoadTransactionDetails;
