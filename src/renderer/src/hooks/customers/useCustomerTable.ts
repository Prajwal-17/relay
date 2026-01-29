import {
  TRANSACTION_TYPE,
  type CustomerTransaction,
  type PageNo,
  type PaginatedApiResponse,
  type TransactionType
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";

const fetchTransactions = async (
  type: TransactionType,
  customerId: string,
  pageNo: PageNo,
  pageSize: number
) => {
  try {
    let response;
    if (type === TRANSACTION_TYPE.SALE) {
      response = await fetch(
        `http://localhost:3000/api/sales?customerId=${customerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json"
          }
        }
      );
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      response = await fetch(
        `http://localhost:3000/api/estimates?customerId=${customerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json"
          }
        }
      );
    } else {
      throw new Error("Invalid Transaction Type");
    }
    const data = await response.json();

    if (data.status === "success") {
      return data;
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
      return fetchTransactions(type, customerId, pageParam, 20);
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<CustomerTransaction[]>) => {
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
    return data?.pages.flatMap((page) => (page.status === "success" ? page.data : [])) ?? [];
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
