import { apiClient } from "@/lib/apiClient";
import type {
  LedgerEntry,
  LedgerSort,
  LedgerSummary,
  LedgerTypeFilter,
  PaginatedApiResponse
} from "@shared/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export type UseCustomerLedgerParams = {
  customerId: string;
  pageNo: number;
  pageSize: number;
  search: string;
  type: LedgerTypeFilter;
  sort: LedgerSort;
};

export function useCustomerLedger(params: UseCustomerLedgerParams) {
  const { customerId, pageNo, pageSize, search, type, sort } = params;

  const { data, isError, error, status, isFetching } = useQuery({
    queryKey: ["customer-ledger", customerId, pageNo, pageSize, search, type, sort],
    queryFn: () =>
      apiClient.get<PaginatedApiResponse<{ data: LedgerEntry[] | [] }>>(
        `/api/customers/${customerId}/ledger`,
        { pageNo, pageSize, search, type, sort }
      ),
    enabled: !!customerId,
    placeholderData: keepPreviousData
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return {
    entries: data?.data ?? [],
    totalCount: data?.totalCount ?? 0,
    nextPageNo: data?.nextPageNo ?? null,
    status,
    isFetching,
    isError
  };
}

export function useCustomerLedgerSummary(customerId: string) {
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ["customer-ledger-summary", customerId],
    queryFn: () => apiClient.get<LedgerSummary>(`/api/customers/${customerId}/ledger-summary`),
    enabled: !!customerId
  });

  return { summary: data, isFetching, isError, refetch };
}
