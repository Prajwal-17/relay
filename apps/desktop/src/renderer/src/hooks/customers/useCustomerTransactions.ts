import { apiClient } from "@/lib/apiClient";
import {
  type CustomerTransaction,
  type CustomerTxnSort,
  type CustomerTxnStatus,
  type PaginatedApiResponse,
  TRANSACTION_TYPE,
  type TransactionType
} from "@shared/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export type CustomerTxn = CustomerTransaction;

export type TxnSortBy = CustomerTxnSort;
export type TxnStatusFilter = CustomerTxnStatus;

export type UseCustomerTransactionsParams = {
  customerId: string;
  type: TransactionType;
  pageNo: number;
  pageSize: number;
  search: string;
  status: TxnStatusFilter;
  sort: TxnSortBy;
};

export function useCustomerTransactions(params: UseCustomerTransactionsParams) {
  const { customerId, type, pageNo, pageSize, search, status, sort } = params;

  const {
    data,
    isError,
    error,
    status: queryStatus,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ["customer-txns", customerId, type, pageNo, pageSize, search, status, sort],
    queryFn: () => {
      const path =
        type === TRANSACTION_TYPE.SALE
          ? `/api/customers/${customerId}/sales`
          : `/api/customers/${customerId}/estimates`;

      return apiClient.get<PaginatedApiResponse<{ data: CustomerTxn[] | [] }>>(path, {
        pageNo,
        pageSize,
        search,
        status,
        sort
      });
    },
    enabled: !!customerId && !!type,
    placeholderData: keepPreviousData
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return {
    transactions: data?.data ?? [],
    totalCount: data?.totalCount ?? 0,
    nextPageNo: data?.nextPageNo ?? null,
    status: queryStatus,
    isFetching,
    isError,
    refetch
  };
}
