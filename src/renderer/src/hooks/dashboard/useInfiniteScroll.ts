import type {
  DateRangeType,
  EstimateSummaryType,
  PageNo,
  PaginatedApiResponse,
  SaleSummaryType,
  SortType
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useDashboard } from "./useDashboard";
import { useDateRangePicker } from "./useDateRangePicker";

export type UnifiedTransaction = {
  id: string;
  transactionNo: number;
  type: "sale" | "estimate";
  customerName: string;
  customerId: string;
  grandTotal: number;
  totalQuantity: number;
  isPaid: boolean;
  createdAt?: string;
};

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

export const useInfiniteScroll = (pathname: string) => {
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
    queryKey: [`${pathname}`, date, sortBy],
    queryFn: ({ pageParam = 1 }) => {
      if (pathname === "/sale") {
        return fetchSales(date as DateRangeType, sortBy, pageParam);
      } else if (pathname === "/estimate") {
        return fetchEstimates(date as DateRangeType, sortBy, pageParam);
      } else {
        throw new Error("Something went wrong");
      }
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<SaleSummaryType | EstimateSummaryType>) => {
      return lastPage.status === "success" ? (lastPage.nextPageNo ?? null) : null;
    }
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const transactionData = useMemo(() => {
    return (
      data?.pages.flatMap((page): UnifiedTransaction[] => {
        if (page.status !== "success" || !page.data) {
          return [];
        }

        if (pathname === "/sale") {
          const saleData = (page.data as SaleSummaryType).sales;
          return saleData
            ? saleData.map((sale) => ({
                id: sale.id,
                transactionNo: sale.invoiceNo,
                type: "sale",
                customerName: sale.customerName,
                customerId: sale.customerId ?? "",
                grandTotal: sale.grandTotal ? sale.grandTotal : 0,
                totalQuantity: sale.totalQuantity ?? 0,
                isPaid: sale.isPaid,
                createdAt: sale.createdAt
              }))
            : [];
        }

        if (pathname === "/estimate") {
          const estimateData = (page.data as EstimateSummaryType).estimates;
          return estimateData
            ? estimateData.map((estimate) => ({
                id: estimate.id,
                transactionNo: estimate.estimateNo,
                type: "estimate",
                customerName: estimate.customerName,
                customerId: estimate.customerId ?? "",
                grandTotal: estimate.grandTotal ? estimate.grandTotal : 0,
                totalQuantity: estimate.totalQuantity ?? 0,
                isPaid: estimate.isPaid,
                createdAt: estimate.createdAt
              }))
            : [];
        }

        return [];
      }) ?? []
    );
  }, [data, pathname]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? transactionData.length + 1 : transactionData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
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
