import { useProductsStore } from "@/store/productsStore";
import { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "./useDebounce";

type ParamsType = {
  fetchFn: (query: string, pageNo: number, pageSize: number) => Promise<any>;
  stateUpdater: (mode: "append" | "replace", data: any) => void;
  delay: number;
  pageSize: number;
};

export const useInfiniteScroll = ({ fetchFn, stateUpdater, delay, pageSize }: ParamsType) => {
  if (!fetchFn) {
    console.log("fetch fn", fetchFn);
  }
  const searchParam = useProductsStore((state) => state.searchParam);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const debouncedSearchParam = useDebounce(searchParam, delay);
  const [hasMore, setHasMore] = useState(true);
  const [pageNo, setPageNo] = useState<number>(1); // page number
  const [loading, setLoading] = useState(false);

  const handleFetch = useCallback(
    async (query: string, fetchPage: number, mode: "replace" | "append") => {
      setLoading(true);
      try {
        if (mode === "replace") {
          stateUpdater(mode, []);
        }
        console.log(query, pageNo, mode, pageSize);
        const response = await fetchFn(query, fetchPage, pageSize);
        if (response.status) {
          stateUpdater(mode, response.data);
          setPageNo(pageNo + 1);
          if (response.data.length < pageSize) {
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
    [stateUpdater, fetchFn, pageSize, pageNo]
  );

  useEffect(() => {
    if (debouncedSearchParam) {
      setHasMore(true);
      setPageNo(1);
      handleFetch(debouncedSearchParam, 1, "replace");
    } else {
      stateUpdater("replace", []);
      setHasMore(true);
      setPageNo(1);
    }
  }, [debouncedSearchParam, handleFetch, stateUpdater, pageSize]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || loading || !hasMore) return;

    // TODO: add how percentage is calculated
    const scrollPercent =
      (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;

    if (scrollPercent >= 80) {
      handleFetch(debouncedSearchParam, pageNo, "append");
    }
  }, [loading, hasMore, pageNo, handleFetch, pageSize, debouncedSearchParam]);

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
    searchParam,
    setSearchParam,
    scrollRef,
    loading
  };
};
