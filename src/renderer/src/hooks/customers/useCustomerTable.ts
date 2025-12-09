import {
  TRANSACTION_TYPE,
  type Estimate,
  type PageNo,
  type PaginatedApiResponse,
  type Sale,
  type TransactionType
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";

export type UnifiedTransaction = {
  id: string;
  transactionNo: number;
  type: "sale" | "estimate";
  customerId: string;
  grandTotal: number;
  totalQuantity: number;
  isPaid: boolean;
  createdAt?: string;
};

const fetchTransactions = async (customerId: string, type: TransactionType, pageNo: PageNo) => {
  try {
    const response = await window.customersApi.getAllTransactionsById(customerId, type, pageNo);
    if (response.status === "success") {
      return response;
    }
    throw new Error(response.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

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
    queryFn: ({ pageParam = 1 }) => {
      return fetchTransactions(customerId, type, pageParam);
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<Sale[] | Estimate[]>) => {
      return lastPage.status === "success" ? (lastPage.nextPageNo ?? null) : null;
    },
    enabled: !!customerId && !!type
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

        if (type === TRANSACTION_TYPE.SALE) {
          const saleData = page.data as Sale[];
          return saleData
            ? saleData.map((sale) => ({
                id: sale.id,
                transactionNo: sale.invoiceNo,
                type: "sale",
                customerId: sale.customerId ?? "",
                grandTotal: sale.grandTotal ? sale.grandTotal : 0,
                totalQuantity: sale.totalQuantity ?? 0,
                isPaid: sale.isPaid,
                createdAt: sale.createdAt
              }))
            : [];
        }

        if (type === TRANSACTION_TYPE.ESTIMATE) {
          const estimateData = page.data as Estimate[];
          return estimateData
            ? estimateData.map((estimate) => ({
                id: estimate.id,
                transactionNo: estimate.estimateNo,
                type: "estimate",
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
  }, [data, type]);

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
