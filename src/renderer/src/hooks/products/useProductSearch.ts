import { SEARCH_DROPDOWN_DELAY, SEARCH_DROPDOWN_ITEMS_LIMIT } from "@/constants";
import { useBillingStore } from "@/store/billingStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "../useDebounce";

const useProductSearch = () => {
  const searchParam = useSearchDropdownStore((state) => state.searchParam);
  const searchResult = useSearchDropdownStore((state) => state.searchResult);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
  const addLineItem = useBillingStore((state) => state.addLineItem);
  const addEmptyLineItem = useBillingStore((state) => state.addEmptyLineItem);
  const searchRow = useSearchDropdownStore((state) => state.searchRow);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const debouncedSearchParam = useDebounce(searchParam, SEARCH_DROPDOWN_DELAY);

  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (term: string, fetchPage: number, mode: "replace" | "append", limit: number) => {
      setLoading(true);
      try {
        if (mode === "replace") {
          setSearchResult("replace", []);
        }
        const response = await window.productsApi.search(term, fetchPage, limit);
        if (response.status === "success") {
          setSearchResult(mode, response.data);
          setPage(fetchPage + 1);
          if (response.data.length < limit) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.log(error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [setSearchResult]
  );

  useEffect(() => {
    if (debouncedSearchParam) {
      setHasMore(true);
      setPage(1);
      fetchProducts(debouncedSearchParam, 1, "replace", SEARCH_DROPDOWN_ITEMS_LIMIT);
    } else {
      setSearchResult("replace", []);
      setHasMore(true);
      setPage(1);
    }
  }, [debouncedSearchParam, fetchProducts, setSearchResult]);

  const handleScroll = useCallback(() => {
    const container = dropdownRef.current;
    if (!container || loading || !hasMore) return;

    const scrollPercent =
      (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;

    if (scrollPercent >= 80) {
      fetchProducts(searchParam, page, "append", SEARCH_DROPDOWN_ITEMS_LIMIT);
    }
  }, [loading, hasMore, searchParam, page, fetchProducts]);

  useEffect(() => {
    const container = dropdownRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

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

  return {
    isDropdownOpen,
    searchRow,
    dropdownRef,
    searchResult,
    loading,
    addLineItem,
    setIsDropdownOpen,
    addEmptyLineItem,
    setActionType,
    setOpenProductDialog,
    setFormDataState
  };
};

export default useProductSearch;
