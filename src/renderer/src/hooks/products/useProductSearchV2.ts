import { PRODUCTS_SEARCH_DELAY, PRODUCTS_SEARCH_PAGE_SIZE } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import type { PaginatedApiResponse, ProductsType } from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useDebounce from "../useDebounce";

export const fetchProducts = async (query, pageNo, pageSize) => {
  try {
    const response = await window.productsApi.search(query, pageNo, pageSize);
    return response;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

export const useProductSearchV2 = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const searchParam = useProductsStore((state) => state.searchParam);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);

  const debouncedValue = useDebounce(searchParam, PRODUCTS_SEARCH_DELAY);

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
    queryKey: ["productSearch", debouncedValue],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts(searchParam, pageParam, PRODUCTS_SEARCH_PAGE_SIZE),
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<ProductsType[] | []>) => {
      return lastPage.status === "success" ? (lastPage.nextPageNo ?? null) : null;
    }
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const searchResults = useMemo(() => {
    return data?.pages.flatMap((page) => (page.status === "success" ? page.data : [])) ?? [];
  }, [data]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? searchResults.length + 1 : searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 95,
    overscan: 5
  });

  const virtualItems = rowVirtualizer.getVirtualItems().reverse();

  useEffect(() => {
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem &&
      lastItem.index >= searchResults.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [fetchNextPage, searchResults, hasNextPage, isFetchingNextPage, virtualItems]);

  return {
    searchParam,
    setSearchParam,
    searchResults,
    parentRef,
    error,
    isLoading,
    status,
    rowVirtualizer
  };
};
