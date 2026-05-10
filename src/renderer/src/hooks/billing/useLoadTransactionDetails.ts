import { apiClient } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
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
  const activeTabRoutePath = tabId
    ? useBillingTabsStore.getState().tabs.find((t) => t.id === tabId)?.routePath
    : undefined;

  // prevent fetching if react router's async URL (id) hasn't caught up to Zustand's active tab route yet
  const isRouteSynced = !!id && !!activeTabRoutePath && activeTabRoutePath.includes(`/${id}/`);

  const shouldFetch =
    !!id &&
    !!tabId &&
    isRouteSynced &&
    (type === TRANSACTION_TYPE.SALE || type === TRANSACTION_TYPE.ESTIMATE) &&
    String(currentSession?.billingId) !== String(id);

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
      useBillingTabsStore.getState().updateTab(tabId, { transactionNo: data.transactionNo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data, tabId]);
  const isDetailsLoading = shouldFetch && isLoading;
  return { status, isLoading: isDetailsLoading, isFetched };
};

export default useLoadTransactionDetails;
