import { CUSTOMERS_PAGE_SIZE, CUSTOMERS_SEARCH_DELAY } from "@/constants";
import { apiClient } from "@/lib/apiClient";
import {
  CUSTOMER_SORT_BY,
  CUSTOMER_TYPE,
  type Customer,
  type CustomerSortByType,
  type CustomerType,
  type PaginatedApiResponse
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import useDebounce from "../useDebounce";

type CustomersPageResult = {
  data: Customer[];
};

export const useCustomersInfinite = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerType>(CUSTOMER_TYPE.ALL);
  const [sortBy, setSortBy] = useState<CustomerSortByType>(CUSTOMER_SORT_BY.NAME_ASC);

  const debouncedQuery = useDebounce(search, CUSTOMERS_SEARCH_DELAY);

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
    queryKey: ["customers-infinite", debouncedQuery, typeFilter, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedApiResponse<CustomersPageResult>>("/api/customers", {
        pageNo: pageParam,
        pageSize: CUSTOMERS_PAGE_SIZE,
        query: debouncedQuery,
        type: typeFilter,
        sort: sortBy
      }),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<CustomersPageResult>) => {
      return lastPage.nextPageNo ?? null;
    },
    enabled: true
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const customersData = useMemo(() => {
    return data?.pages.flatMap((page) => (page.data ? page.data : [])) ?? [];
  }, [data]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? customersData.length + 1 : customersData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem &&
      lastItem.index >= customersData.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, customersData.length, virtualItems]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    parentRef,
    rowVirtualizer,
    virtualItems,
    customersData,
    status,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    totalCount,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy
  };
};
