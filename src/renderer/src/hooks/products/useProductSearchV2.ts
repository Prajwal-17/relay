import { PRODUCTS_SEARCH_DELAY, PRODUCTS_SEARCH_PAGE_SIZE } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import {
  type PaginatedApiResponse,
  type ProductFilterType,
  type ProductsType
} from "@shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useDebounce from "../useDebounce";

export const PRODUCTSEARCH_TYPE = {
  PRODUCTPAGE: "product-page",
  BILLINGPAGE: "billing-page"
} as const;

type ProductSearchType = (typeof PRODUCTSEARCH_TYPE)[keyof typeof PRODUCTSEARCH_TYPE];

export const fetchProducts = async (
  query: string,
  pageNo: number,
  pageSize: number,
  filterType: ProductFilterType
) => {
  try {
    const response = await window.productsApi.search(query, pageNo, pageSize, filterType);
    return response;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

export const useProductSearchV2 = (type: ProductSearchType) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const productsSearchParam = useProductsStore((state) => state.searchParam);
  const setProductsSearchParam = useProductsStore((state) => state.setSearchParam);
  const dropdownSearchParam = useSearchDropdownStore((state) => state.searchParam);
  const filterType = useProductsStore((state) => state.filterType);

  const productsDebouncedValue = useDebounce(productsSearchParam, PRODUCTS_SEARCH_DELAY);
  const dropdownDebouncedValue = useDebounce(dropdownSearchParam, PRODUCTS_SEARCH_DELAY);

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
    queryKey: [
      filterType,
      type === PRODUCTSEARCH_TYPE.PRODUCTPAGE ? productsDebouncedValue : dropdownDebouncedValue
    ],
    queryFn: ({ pageParam = 1 }) => {
      if (type === PRODUCTSEARCH_TYPE.PRODUCTPAGE) {
        return fetchProducts(
          productsDebouncedValue,
          pageParam,
          PRODUCTS_SEARCH_PAGE_SIZE,
          filterType
        );
      } else if (type === PRODUCTSEARCH_TYPE.BILLINGPAGE) {
        return fetchProducts(
          dropdownDebouncedValue,
          pageParam,
          PRODUCTS_SEARCH_PAGE_SIZE,
          filterType
        );
      }
      throw new Error("Something went wrong");
    },
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

  /**
   * use `useWindowVirtualizer` hook to virtualize the whole window & remove fixed height and react ref
   * estimateSize is the size of the virtual element
   */
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? searchResults.length + 1 : searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 95
    // overscan: 5
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

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
    productsSearchParam,
    setProductsSearchParam,
    searchResults,
    parentRef,
    error,
    isLoading,
    status,
    rowVirtualizer,
    virtualItems,
    hasNextPage
  };
};
