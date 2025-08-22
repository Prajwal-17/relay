import useDebounce from "@/hooks/useDebounce";
import { useBillingStore } from "@/store/billingStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useCallback, useEffect, useRef, useState } from "react";

const SearchDropdown = ({ idx }: { idx: number }) => {
  const searchParam = useSearchDropdownStore((state) => state.searchParam);
  const searchResult = useSearchDropdownStore((state) => state.searchResult);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
  const addLineItem = useBillingStore((state) => state.addLineItem);
  const addEmptyLineItem = useBillingStore((state) => state.addEmptyLineItem);
  const searchRow = useSearchDropdownStore((state) => state.searchRow);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const debouncedSearchParam = useDebounce(searchParam, 200);

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
          console.log(response.error);
          setHasMore(false);
        }
      } catch (error) {
        console.log("error", error);
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
      fetchProducts(debouncedSearchParam, 1, "replace", 20);
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
      fetchProducts(searchParam, page, "append", 20);
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

  return (
    <>
      {isDropdownOpen && searchRow === idx + 1 && (
        <div
          ref={dropdownRef}
          className="border-primary absolute top-full right-0 left-32 z-20 mx-1 h-96 overflow-y-auto scroll-smooth rounded-md border-2 bg-neutral-200 transition-all"
        >
          <div
            className="text-accent-foreground border-border sticky top-0 grid w-full grid-cols-8 items-center border bg-white px-2 py-2 text-base font-semibold"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="col-span-4 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
            <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">MRP</div>
          </div>
          <div className="space-y-2 px-2 py-2 text-lg">
            {searchResult.map((item, index) => (
              <div
                key={index}
                className="grid w-full grid-cols-8 rounded-lg px-2 py-1 hover:cursor-pointer hover:bg-blue-200"
                onClick={() => {
                  addLineItem(idx, item);
                  setIsDropdownOpen();
                  addEmptyLineItem();
                }}
              >
                <div className="col-span-4 border-r border-black px-1 py-1">{item.name}</div>
                <div className="col-span-2 border-r border-black px-1 py-1">{item.price}</div>
                <div className="col-span-2 px-1 py-1">{item.mrp}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchDropdown;
