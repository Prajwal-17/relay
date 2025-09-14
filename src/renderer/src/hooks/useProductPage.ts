import { PRODUCTS_LIMIT } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import type { FilterType } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "./useDebounce";

const useProductPage = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchParam = useProductsStore((state) => state.searchParam);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const searchResult = useProductsStore((state) => state.searchResult);
  const setSearchResult = useProductsStore((state) => state.setSearchResult);
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormData = useProductsStore((state) => state.setFormData);

  const debouncedSearchParam = useDebounce(searchParam, 300);
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
      fetchProducts(debouncedSearchParam, 1, "replace", PRODUCTS_LIMIT);
    } else {
      setSearchResult("replace", []);
      setHasMore(true);
      setPage(1);
    }
  }, [debouncedSearchParam, fetchProducts, setSearchResult]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || loading || !hasMore) return;

    const scrollPercent =
      (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;

    if (scrollPercent >= 80) {
      fetchProducts(searchParam, page, "append", PRODUCTS_LIMIT);
    }
  }, [loading, hasMore, searchParam, page, fetchProducts]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll, searchParam]);

  return {
    scrollRef,
    openProductDialog,
    searchParam,
    searchResult,
    filterType,
    setActionType,
    setFormData,
    setSearchParam,
    setOpenProductDialog,
    setFilterType
  };
};

export default useProductPage;
