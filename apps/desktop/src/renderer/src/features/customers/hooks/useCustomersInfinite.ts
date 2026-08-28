import { CUSTOMERS_PAGE_SIZE, CUSTOMERS_SEARCH_DELAY } from "@/constants/renderer.constants";
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
import { useMemo, useState } from "react";
import useDebounce from "@/hooks/useDebounce";

type CustomersPageResult = {
  data: Customer[];
};

export const useCustomersInfinite = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerType>(CUSTOMER_TYPE.ALL);
  const [sortBy, setSortBy] = useState<CustomerSortByType>(CUSTOMER_SORT_BY.NAME_ASC);
  const [includeArchived, setIncludeArchived] = useState(false);

  const debouncedQuery = useDebounce(search, CUSTOMERS_SEARCH_DELAY);

  const {
    data,
    error,
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
  } = useInfiniteQuery({
    queryKey: ["customers-infinite", debouncedQuery, typeFilter, sortBy, includeArchived],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedApiResponse<CustomersPageResult>>("/api/customers", {
        pageNo: pageParam,
        pageSize: CUSTOMERS_PAGE_SIZE,
        query: debouncedQuery,
        type: typeFilter,
        sort: sortBy,
        includeArchived
      }),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<CustomersPageResult>) => {
      return lastPage.nextPageNo ?? null;
    },
    enabled: true
  });

  const customersData = useMemo(() => {
    return data?.pages.flatMap((page) => (page.data ? page.data : [])) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    customersData,
    status,
    isLoading,
    isError,
    error,
    refetch,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPlaceholderData,
    fetchNextPage,
    totalCount,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    includeArchived,
    setIncludeArchived,
    debouncedQuery
  };
};
