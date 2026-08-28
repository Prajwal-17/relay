import { apiClient } from "@/lib/apiClient";
import {
  buildTransactionDisplayRows,
  type TransactionGroupBy
} from "@/features/transactions/transactionGrouping";
import {
  type DashboardType,
  type PaginatedApiResponse,
  type TransactionListResponse
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import { useDashboardStore } from "../store/dashboard.store";

export const useInfiniteScroll = (
  type: DashboardType,
  search: string,
  groupBy: TransactionGroupBy
) => {
  const date = useDashboardStore((state) => state.date);
  const sortBy = useDashboardStore((state) => state.sortBy);
  const normalizedSearch = search.trim();

  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isError,
    isFetching,
    isPlaceholderData,
    isFetchNextPageError,
    refetch,
    status
  } = useInfiniteQuery<PaginatedApiResponse<TransactionListResponse>>({
    queryKey: [
      "transactions",
      type,
      normalizedSearch,
      date.from?.toISOString(),
      date.to?.toISOString(),
      sortBy
    ],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedApiResponse<TransactionListResponse>>(`/api/${type}`, {
        search: normalizedSearch,
        from: date.from?.toISOString(),
        to: date.to?.toISOString(),
        sortBy,
        pageNo: pageParam as number,
        pageSize: 20
      }),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<TransactionListResponse>) => {
      return lastPage.nextPageNo ?? null;
    },
    enabled: !!type
  });

  const transactionData = useMemo(() => {
    return data?.pages.flatMap((page) => (page.transactions ? page.transactions : [])) ?? [];
  }, [data]);

  const displayRows = useMemo(
    () => buildTransactionDisplayRows(transactionData, groupBy),
    [groupBy, transactionData]
  );

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? displayRows.length + 1 : displayRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (displayRows[index]?.kind === "group" ? 32 : 48),
    getItemKey: (index) => displayRows[index]?.key ?? "loader"
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (parentRef.current) parentRef.current.scrollTop = 0;
    rowVirtualizer.measure();
  }, [groupBy, rowVirtualizer]);

  useEffect(() => {
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem &&
      lastItem.index >= displayRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError &&
      !isPlaceholderData
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    displayRows.length,
    isPlaceholderData,
    virtualItems
  ]);

  const { totalRevenue, totalTransactions } = useMemo(() => {
    const firstPage = data?.pages[0];
    return {
      totalRevenue: firstPage?.totalRevenue,
      totalTransactions: firstPage?.totalTransactions
    };
  }, [data]);

  return {
    parentRef,
    rowVirtualizer,
    isFetchingNextPage,
    isLoading,
    status,
    transactionData,
    displayRows,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    totalRevenue,
    totalTransactions,
    isError,
    isFetchNextPageError,
    refetch,
    fetchNextPage,
    date,
    sortBy,
    search: normalizedSearch
  };
};
