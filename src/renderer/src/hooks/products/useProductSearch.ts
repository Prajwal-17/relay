import { PRODUCTS_SEARCH_DELAY, PRODUCTS_SEARCH_PAGE_SIZE } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { type PaginatedApiResponse, type Product, type ProductFilterType } from "@shared/types";
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

export const useProductSearch = (type: ProductSearchType) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const productsSearchParam = useProductsStore((state) => state.searchParam);
  const setProductsSearchParam = useProductsStore((state) => state.setSearchParam);
  const dropdownSearchParam = useSearchDropdownStore((state) => state.itemQuery);
  const filterType = useProductsStore((state) => state.filterType);

  const productsDebouncedValue = useDebounce(productsSearchParam, PRODUCTS_SEARCH_DELAY);
  const dropdownDebouncedValue = useDebounce(dropdownSearchParam, PRODUCTS_SEARCH_DELAY);

  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen();
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

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
    getNextPageParam: (lastPage: PaginatedApiResponse<Product[] | []>) => {
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
    isDropdownOpen,
    dropdownRef,
    setIsDropdownOpen,
    error,
    isLoading,
    status,
    rowVirtualizer,
    virtualItems,
    hasNextPage
  };
};
