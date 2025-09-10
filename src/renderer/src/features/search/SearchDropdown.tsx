import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEARCH_DROPDOWN_DELAY, SEARCH_DROPDOWN_ITEMS_LIMIT } from "@/constants";
import { ignoredWeight } from "@/constants/IgnoredWeights";
import useDebounce from "@/hooks/useDebounce";
import { useBillingStore } from "@/store/billingStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { Edit, Package } from "lucide-react";
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
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormData = useProductsStore((state) => state.setFormData);

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

  return (
    <>
      {isDropdownOpen && searchRow === idx + 1 && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 left-35 z-20 mx-1 w-full max-w-3xl transition-all"
        >
          <Card className="h-full max-h-full overflow-hidden border-2 border-blue-500 bg-white shadow-xl">
            <div className="max-h-96 overflow-y-auto scroll-smooth py-0">
              {searchResult.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Package className="mx-auto mb-2 h-6 w-6 opacity-30" />
                  <p className="text-xl">No products found</p>
                </div>
              ) : (
                <div className="flex flex-col justify-center divide-y divide-gray-100 py-0">
                  {searchResult.map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-4 border-l-4 border-transparent px-4 py-3 transition-all duration-200 hover:cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                      onClick={() => {
                        addLineItem(idx, item);
                        setIsDropdownOpen();
                        addEmptyLineItem();
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100 transition-all group-hover:from-blue-100 group-hover:to-blue-200">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="truncate text-lg font-semibold text-gray-900 group-hover:text-blue-900">
                                {item.name}
                              </h4>
                              {item.weight !== null &&
                                ignoredWeight.some((w) =>
                                  `${item.weight}+${item.unit}`.includes(w)
                                ) && (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-orange-200 bg-orange-50 px-2.5 py-0.5 text-base font-semibold text-orange-700 shadow-sm"
                                  >
                                    {item.weight}
                                    {item.unit}
                                  </Badge>
                                )}
                              {item.mrp && (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5 text-base font-medium text-slate-600"
                                >
                                  MRP ₹{item.mrp}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-xl font-bold text-green-600">₹ {item.price}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionType("billing-page-edit");
                          setOpenProductDialog();
                          setFormData({
                            ...item,
                            mrp: item.mrp,
                            price: item.price
                          });
                        }}
                        className="hover:cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="p-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    Loading more products...
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default SearchDropdown;
