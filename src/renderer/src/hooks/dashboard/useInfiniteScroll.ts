import type {
  DateRangeType,
  PageNo,
  PaginatedApiResponse,
  SalesType,
  SortType
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useDashboard } from "./useDashboard";
import { useDateRangePicker } from "./useDateRangePicker";

const fetchSales = async (dateRange: DateRangeType, sortBy: SortType, pageNo: PageNo) => {
  try {
    const response = await window.salesApi.getSalesDateRange(dateRange, sortBy, pageNo);
    if (response.status === "success") {
      return response;
    }
    throw new Error(response.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const fetchEstimates = async (dateRange: DateRangeType, sortBy: SortType, pageNo: PageNo) => {
  try {
    const response = await window.estimatesApi.getEstimatesDateRange(dateRange, sortBy, pageNo);
    if (response.status === "success") {
      return response;
    }
    throw new Error(response.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const useInfiniteScroll = () => {
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
    queryKey: ["sales", date?.from?.toISOString() ?? null, date?.to?.toISOString() ?? null, sortBy],
    queryFn: ({ pageParam = 1 }) => fetchSales(date as DateRangeType, sortBy, pageParam),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<SalesType[] | []>) => {
      return lastPage.status === "success" ? (lastPage.nextPageNo ?? null) : null;
    }
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const transactionData =
    data?.pages.flatMap((page) => (page.status === "success" ? page.data : [])) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? transactionData.length + 1 : transactionData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 1000,
    overscan: 5
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
    isLoading,
    status,
    transactionData,
    hasNextPage
  };
};
