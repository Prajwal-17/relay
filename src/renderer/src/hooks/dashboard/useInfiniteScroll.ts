import {
  DASHBOARD_TYPE,
  type DateRangeType,
  type PageNo,
  type PaginatedApiResponse,
  type SortType,
  type TransactionListResponse
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useDashboard } from "./useDashboard";
import { useDateRangePicker } from "./useDateRangePicker";

const fetchSales = async (
  dateRange: DateRangeType,
  sortBy: SortType,
  pageNo: PageNo,
  pageSize: number
) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/sales?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&sortBy=${sortBy}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        method: "GET"
      }
    );
    const data = await response.json();

    if (data.status === "success") {
      return data;
    }
    throw new Error(data.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const fetchEstimates = async (
  dateRange: DateRangeType,
  sortBy: SortType,
  pageNo: PageNo,
  pageSize: number
) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/estimates?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&sortBy=${sortBy}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        method: "GET"
      }
    );

    const data = await response.json();

    if (data.status === "success") {
      return data;
    }
    throw new Error(data.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

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
    queryFn: ({ pageParam = 1 }) => {
      if (type === DASHBOARD_TYPE.SALES) {
        return fetchSales(date as DateRangeType, sortBy, pageParam, 20);
      } else if (type === DASHBOARD_TYPE.ESTIMATES) {
        return fetchEstimates(date as DateRangeType, sortBy, pageParam, 20);
      } else {
        throw new Error("Something went wrong");
      }
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<TransactionListResponse>) => {
      return lastPage.status === "success" ? (lastPage.nextPageNo ?? null) : null;
    },
    enabled: !!type
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const transactionData = useMemo(() => {
    return (
      data?.pages.flatMap((page) => (page.status === "success" ? page.data.transactions : [])) ?? []
    );
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
      data?.pages.reduce((sum, page) => {
        if (page.status === "error") return sum;
        return page.data.totalRevenue;
      }, 0) ?? 0
    );
  }, [data]);

  const totalTransactions = useMemo(() => {
    return (
      data?.pages.reduce((sum, page) => {
        if (page.status === "error") return sum;
        return page.data.totalTransactions;
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
