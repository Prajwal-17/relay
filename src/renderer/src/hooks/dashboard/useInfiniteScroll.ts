import { apiClient } from "@/lib/apiClient";
import { type PaginatedApiResponse, type TransactionListResponse } from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useDashboard } from "./useDashboard";
import { useDateRangePicker } from "./useDateRangePicker";

export const useInfiniteScroll = (type: string) => {
  const { date } = useDateRangePicker();
  const { sortBy } = useDashboard();

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
    queryKey: [`${type}`, date, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get(`/api/${type}`, {
        from: date?.from?.toISOString(),
        to: date?.to?.toISOString(),
        sortBy: sortBy,
        pageNo: pageParam,
        pageSize: 20
      }),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<TransactionListResponse>) => {
      return lastPage.nextPageNo ?? null;
    },
    enabled: !!type
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const transactionData = useMemo(() => {
    return data?.pages.flatMap((page) => (page.transactions ? page.transactions : [])) ?? [];
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

  const totalRevenue = useMemo(() => {
    return (
      data?.pages.reduce((_sum, page) => {
        return page.totalRevenue;
      }, 0) ?? 0
    );
  }, [data]);

  const totalTransactions = useMemo(() => {
    return (
      data?.pages.reduce((_sum, page) => {
        return page.totalTransactions;
      }, 0) ?? 0
    );
  }, [data]);

  return {
    parentRef,
    rowVirtualizer,
    isFetchingNextPage,
    isLoading,
    status,
    transactionData,
    hasNextPage,
    totalRevenue,
    totalTransactions
  };
};
