import { apiClient } from "@/lib/apiClient";
import type {
  LedgerEntry,
  LedgerSort,
  LedgerSummary,
  LedgerTypeFilter,
  PaginatedApiResponse
} from "@shared/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const EMPTY_LEDGER_ENTRIES: LedgerEntry[] = [];

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

  const { data, isError, error, status, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: ["customer-ledger", customerId, pageNo, pageSize, search, type, sort],
    queryFn: () =>
      apiClient.get<PaginatedApiResponse<{ data: LedgerEntry[] | [] }>>(
        `/api/customers/${customerId}/ledger`,
        { pageNo, pageSize, search, type, sort }
      ),
    enabled: !!customerId,
    placeholderData: keepPreviousData
  });

  return {
    entries: data?.data ?? EMPTY_LEDGER_ENTRIES,
    totalCount: data?.totalCount ?? 0,
    nextPageNo: data?.nextPageNo ?? null,
    status,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch
  };
}

export function useCustomerLedgerSummary(customerId: string) {
  const { data, isError, error, status, isFetching, refetch } = useQuery({
    queryKey: ["customer-ledger-summary", customerId],
    queryFn: () => apiClient.get<LedgerSummary>(`/api/customers/${customerId}/ledger-summary`),
    enabled: !!customerId
  });

  return { summary: data, status, isFetching, isError, error, refetch };
}
