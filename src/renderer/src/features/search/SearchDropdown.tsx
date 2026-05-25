import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ignoredWeight } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { formatDateStr } from "@shared/utils/dateUtils";
import { convertToRupees } from "@shared/utils/utils";
import { ArrowDown, ArrowUp, Edit, Info, Package, PackagePlus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-search-highlight rounded-sm text-inherit">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const SearchDropdown = ({ rowId }: { rowId: string }) => {
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
  const setActiveRowId = useSearchDropdownStore((state) => state.setActiveRowId);
  const setItemQuery = useSearchDropdownStore((state) => state.setItemQuery);
  const itemQuery = useSearchDropdownStore((state) => state.itemQuery);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const addLineItem = useBillingSessionStore((state) => state.addLineItem);
  const addEmptyLineItem = useBillingSessionStore((state) => state.addEmptyLineItem);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setProductId = useProductsStore((state) => state.setProductId);

  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  type SortField = "name" | "price" | "mrp" | "weight";
  type SortDir = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField(null);
      setSortDir(null);
    }
  };

  const {
    dropdownRef,
    searchResults,
    parentRef,
    rowVirtualizer,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    virtualItems
  } = useProductSearch(PRODUCTSEARCH_TYPE.BILLINGPAGE);

  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  // auto-scroll the dropdown into view when it opens near the bottom of the page
  useEffect(() => {
    const el = dropdownContainerRef.current;
    if (!el) return;
    el.style.scrollMarginBottom = "10rem";
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const openNewProductDialog = () => {
    setIsDropdownOpen();
    setProductId(null);
    setFormDataState({});
    setDialogMode("edit");
    setActionType("add");
    setOpenProductDialog();
  };

  const setDialogMode = useProductsStore((state) => state.setDialogMode);

  // Only reset highlight when the result count actually changes
  const prevResultsLenRef = useRef(searchResults.length);
  useEffect(() => {
    if (searchResults.length !== prevResultsLenRef.current) {
      setHighlightedIndex(searchResults.length > 0 ? 0 : -1);
      prevResultsLenRef.current = searchResults.length;
    }
  }, [searchResults.length]);

  useEffect(() => {
    if (virtualItems.length === 0) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    const totalRows = hasNextPage ? searchResults.length + 1 : searchResults.length;
    if (lastItem && lastItem.index >= totalRows - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage, searchResults.length]);

  const focusNextRow = useCallback(() => {
    setTimeout(() => {
      if (!activeTabId) return;
      const session = useBillingSessionStore.getState().sessions[activeTabId];
      if (!session) return;

      const visibleItems = session.lineItems.filter((item) => !item.isDeleted);
      const currentIdx = visibleItems.findIndex((item) => item.rowId === rowId);
      if (currentIdx === -1) return;

      // only auto focus if the immediate next row is empty
      const nextRow = visibleItems[currentIdx + 1];
      if (!nextRow || nextRow.name !== "") return;

      setActiveRowId(nextRow.rowId);
      setItemQuery("");
      setIsDropdownOpen();

      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[placeholder="Search products"]'
      );
      const nextInput = inputs[currentIdx + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }, 50);
  }, [activeTabId, setActiveRowId, setItemQuery, setIsDropdownOpen, rowId]);

  const selectProduct = useCallback(
    (index: number) => {
      const product = searchResults[index];
      if (!product || !activeTabId) return;
      addLineItem(activeTabId, rowId, product);
      setIsDropdownOpen();
      addEmptyLineItem(activeTabId);
      processSyncQueue(activeTabId);
      focusNextRow();
    },
    [
      searchResults,
      activeTabId,
      rowId,
      addLineItem,
      setIsDropdownOpen,
      addEmptyLineItem,
      focusNextRow
    ]
  );

  // arrow keys navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const len = searchResults.length;
      if (len === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < len - 1 ? prev + 1 : 0;
          rowVirtualizer.scrollToIndex(next, { align: "auto" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : len - 1;
          rowVirtualizer.scrollToIndex(next, { align: "auto" });
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndexRef.current >= 0) {
          selectProduct(highlightedIndexRef.current);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchResults, rowVirtualizer, selectProduct]);

  return (
    <>
      <div ref={dropdownRef}>
        <div
          ref={dropdownContainerRef}
          className="bg-background border-border/80 absolute top-[calc(100%+0.5rem)] left-[10.7%] z-30 flex max-h-96 w-[60%] flex-col overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        >
          {searchResults.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center px-6 py-10 text-center">
              <div className="bg-muted/50 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Search className="h-6 w-6 opacity-60" />
              </div>
              <h3 className="text-foreground mb-1.5 text-lg font-semibold">No products found</h3>
              <p className="mb-5 max-w-sm text-sm font-medium">
                Add the product now and continue billing without leaving this screen.
              </p>
              <Button
                variant="outline"
                onClick={openNewProductDialog}
                className="h-11 cursor-pointer rounded-xl px-5 text-sm font-semibold shadow-none"
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                New Product
              </Button>
            </div>
          ) : (
            <>
              <div className="border-border/70 bg-background flex shrink-0 items-center gap-4 border-b px-3.5 py-2">
                <div className="text-muted-foreground text-[0.75rem] font-bold tracking-[0.16em] uppercase">
                  Sort
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { field: "name" as SortField, label: "Name" },
                      { field: "price" as SortField, label: "Price" },
                      { field: "mrp" as SortField, label: "MRP" },
                      { field: "weight" as SortField, label: "Weight" }
                    ] satisfies { field: SortField; label: string }[]
                  ).map(({ field, label }) => {
                    const isActive = sortField === field;
                    return (
                      <button
                        key={field}
                        onClick={() => toggleSort(field)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.82rem] font-semibold transition ${
                          isActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {label}
                        {isActive &&
                          (sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ))}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div ref={parentRef} className="flex-1 overflow-y-auto scroll-smooth py-1">
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualItems[0]?.start ?? 0}px)`
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const product = searchResults[virtualRow.index];
                      if (!product) return null;

                      return (
                        <div
                          key={virtualRow.key}
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                        >
                          <div
                            className={`group flex items-center gap-3.5 rounded-md border-l-3 py-3 pr-3 pl-3 transition-all duration-150 hover:cursor-pointer ${
                              highlightedIndex === virtualRow.index
                                ? "border-foreground bg-foreground/6 ring-foreground/15 ring-1"
                                : "hover:bg-accent/60 border-transparent"
                            }`}
                            onClick={() => {
                              if (!activeTabId) return;
                              addLineItem(activeTabId, rowId, product);
                              setIsDropdownOpen();
                              addEmptyLineItem(activeTabId);
                              processSyncQueue(activeTabId);
                              focusNextRow();
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="border-border/70 from-search-icon-bg-from to-search-icon-bg-to flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-linear-to-br">
                              <Package className="text-search-icon-fg h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <h4 className="text-foreground truncate text-lg font-semibold">
                                      <HighlightedText text={product.name} query={itemQuery} />
                                    </h4>
                                    {product.weight !== null &&
                                      ignoredWeight.some((w) =>
                                        `${product.weight}+${product.unit}`.includes(w)
                                      ) && (
                                        <Badge
                                          variant="outline"
                                          className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5 text-base font-semibold text-slate-600 shadow-sm"
                                        >
                                          {product.weight}
                                          {product.unit}
                                        </Badge>
                                      )}
                                    {product.mrp && (
                                      <Badge
                                        variant="outline"
                                        className="rounded-full border-orange-200 bg-orange-50 px-2.5 py-0.5 text-base font-semibold text-orange-700 shadow-sm"
                                      >
                                        MRP ₹{convertToRupees(product.mrp, { asString: true })}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-success text-xl font-bold">
                                    ₹ {convertToRupees(product.price, { asString: true })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductId(product.id);
                                setActionType("billing-page-edit");
                                setOpenProductDialog();
                                setFormDataState({
                                  name: product.name,
                                  weight: product.weight,
                                  unit: product.unit,
                                  mrp: product.mrp
                                    ? convertToRupees(product.mrp, { asString: true })
                                    : null,
                                  price: convertToRupees(product.price, { asString: true }),
                                  isDisabled: product.isDisabled,
                                  isDeleted: product.isDeleted
                                });
                              }}
                              className="hover:cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 cursor-pointer rounded-lg"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Info className="text-muted-foreground h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs leading-relaxed">
                                <p>
                                  Created:{" "}
                                  {product.createdAt ? formatDateStr(product.createdAt) : "—"}
                                </p>
                                <p>
                                  Updated:{" "}
                                  {product.updatedAt ? formatDateStr(product.updatedAt) : "—"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {!hasNextPage && searchResults.length > 0 && (
                  <div className="text-muted-foreground flex flex-col items-center py-10 text-center">
                    <div className="text-2xl font-medium">No more products</div>
                    <p className="mt-2 text-base opacity-75">
                      You&apos;ve reached the end of the list
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchDropdown;
