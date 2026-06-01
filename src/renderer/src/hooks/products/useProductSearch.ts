import { PRODUCTS_SEARCH_DELAY, PRODUCTS_SEARCH_PAGE_SIZE } from "@/constants";
import { apiClient } from "@/lib/apiClient";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import {
  type BillingProductDTO,
  type PaginatedApiResponse,
  type ProductSearchItemDTO
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

type SearchResultItem = ProductSearchItemDTO | BillingProductDTO;

export const useProductSearch = (type: ProductSearchType) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const productsSearchParam = useProductsStore((state) => state.searchParam);
  const setProductsSearchParam = useProductsStore((state) => state.setSearchParam);
  const dropdownSearchParam = useSearchDropdownStore((state) => state.itemQuery);
  const dropdownSortBy = useSearchDropdownStore((state) => state.sortBy);
  const filterType = useProductsStore((state) => state.filterType);
  const sortBy = useProductsStore((state) => state.sortBy);
  const priceMin = useProductsStore((state) => state.priceMin);
  const priceMax = useProductsStore((state) => state.priceMax);
  const hasMrp = useProductsStore((state) => state.hasMrp);
  const hasPurchasePrice = useProductsStore((state) => state.hasPurchasePrice);

  const productsDebouncedValue = useDebounce(productsSearchParam, PRODUCTS_SEARCH_DELAY);
  const dropdownDebouncedValue = useDebounce(dropdownSearchParam, PRODUCTS_SEARCH_DELAY);

  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the product dialog is currently open, do not close the search dropdown
      const isProductDialogOpen = useProductsStore.getState().openProductDialog;
      if (isProductDialogOpen) return;

      const target = event.target as HTMLElement;
      // If clicking inside a dialog content, overlay, portal, or a select dropdown, ignore
      if (
        target &&
        target.closest &&
        (target.closest('[role="dialog"]') ||
          target.closest('[data-slot^="dialog"]') ||
          target.closest('[data-slot^="select"]'))
      ) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // If the product dialog is open, let the dialog consume Escape and do not close the search dropdown
        const isProductDialogOpen = useProductsStore.getState().openProductDialog;
        if (isProductDialogOpen) return;

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
      type === PRODUCTSEARCH_TYPE.PRODUCTPAGE ? productsDebouncedValue : dropdownDebouncedValue,
      ...(type === PRODUCTSEARCH_TYPE.PRODUCTPAGE
        ? [sortBy, priceMin, priceMax, hasMrp, hasPurchasePrice]
        : [dropdownSortBy])
    ],
    queryFn: ({ pageParam = 1 }) => {
      if (type === PRODUCTSEARCH_TYPE.PRODUCTPAGE) {
        const apiParams: Record<string, string | number | boolean | undefined> = {
          query: productsDebouncedValue,
          pageNo: pageParam,
          pageSize: PRODUCTS_SEARCH_PAGE_SIZE,
          filterType: filterType,
          sortBy: sortBy || undefined,
          hasMrp: hasMrp || undefined,
          hasPurchasePrice: hasPurchasePrice || undefined,
          billingMode: false
        };
        if (priceMin) {
          const parsed = parseFloat(priceMin);
          if (!isNaN(parsed)) apiParams.priceMin = Math.round(parsed * 100);
        }
        if (priceMax) {
          const parsed = parseFloat(priceMax);
          if (!isNaN(parsed)) apiParams.priceMax = Math.round(parsed * 100);
        }
        return apiClient.get("/api/products/search", apiParams);
      } else if (type === PRODUCTSEARCH_TYPE.BILLINGPAGE) {
        return apiClient.get("/api/products/search", {
          query: dropdownDebouncedValue,
          pageNo: pageParam,
          pageSize: PRODUCTS_SEARCH_PAGE_SIZE,
          filterType: filterType,
          sortBy: dropdownSortBy || undefined,
          billingMode: true
        });
      }
      throw new Error("Something went wrong");
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: (lastPage: PaginatedApiResponse<{ data: SearchResultItem[] | [] }>) => {
      return lastPage.nextPageNo ?? null;
    }
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const prevResultsRef = useRef<SearchResultItem[]>([]);

  const searchResults = useMemo(() => {
    const next = data?.pages.flatMap((page) => (page.data ? page.data : [])) ?? [];
    const prev = prevResultsRef.current;

    // return the same reference if the data hasn't changed
    if (prev.length === next.length && next.every((item, i) => item.id === prev[i]?.id)) {
      return prev;
    }

    prevResultsRef.current = next;
    return next;
  }, [data]);

  /**
   * use `useWindowVirtualizer` hook to virtualize the whole window & remove fixed height and react ref
   * estimateSize is the size of the virtual element
   */
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? searchResults.length + 1 : searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 95,
    overscan: 8
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const totalCount = data?.pages[0]?.totalCount;

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
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    totalCount
  };
};
