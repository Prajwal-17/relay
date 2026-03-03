import { apiClient } from "@/lib/apiClient";
import {
  type CustomerTransaction,
  type PaginatedApiResponse,
  type TransactionType
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";

export const useCustomerTable = (customerId: string, type: TransactionType) => {
  const parentRef = useRef<HTMLTableElement>(null);

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isError,
    status
  } = useInfiniteQuery({
    queryKey: [customerId, type],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedApiResponse<{ data: CustomerTransaction[] | [] }>>(
        `/api/customers/${customerId}/${type}s`,
        { pageNo: pageParam, pageSize: 20 }
      ),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<{ data: CustomerTransaction[] | [] }>) => {
      return lastPage.nextPageNo ?? null;
    },
    enabled: !!customerId && !!type
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const transactionData = useMemo(() => {
    return data?.pages.flatMap((page) => (page.data ? page.data : [])) ?? [];
  }, [data]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? transactionData.length + 1 : transactionData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60
    // overscan: 5
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem &&
      lastItem.index >= transactionData.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, transactionData.length, virtualItems]);

  return {
    parentRef,
    rowVirtualizer,
    isFetchingNextPage,
    isLoading,
    status,
    transactionData,
    hasNextPage
  };
};
