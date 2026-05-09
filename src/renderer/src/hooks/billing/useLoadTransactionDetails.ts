import { apiClient } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
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
  tabId?: string | null // here pass activeTabId
) => {
  const currentSession = tabId ? useBillingSessionStore.getState().sessions[tabId] : undefined;
  const shouldFetch =
    !!id &&
    !!tabId &&
    (type === TRANSACTION_TYPE.SALE || type === TRANSACTION_TYPE.ESTIMATE) &&
    currentSession?.billingId !== id;

  const { setLineItems, hydrateSession } = useBillingSessionStore.getState();
  const { data, isSuccess, isLoading, status, isFetched, isError, error } = useQuery({
    queryKey: [type, id, tabId],
    queryFn: async () => apiClient.get<UnifiedTransctionWithItems>(`/api/${type}s/${id}`),
    enabled: shouldFetch
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  useEffect(() => {
    if (!tabId || !isSuccess || !data) return;

    const sessions = useBillingSessionStore.getState().sessions;
    if (!sessions[tabId]) return;

    if (isSuccess && data) {
      hydrateSession(tabId, {
        billingId: data.id,
        billingType: data.type,
        transactionNo: data.transactionNo,
        billingDate: new Date(data.createdAt as string),
        customerId: data.customerId,
        customerName: data.customer.name
      });
      setLineItems(tabId, data.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data, tabId]);
  return { status, isLoading, isFetched };
};

export default useLoadTransactionDetails;
