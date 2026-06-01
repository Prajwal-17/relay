import { HighlightedText } from "@/components/highlighted-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ignoredWeight, PROTOCOL_NAME } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { ACTION_TYPE, DIALOG_MODE, PRODUCT_SORT_BY } from "@shared/types";
import { formatDateStr } from "@shared/utils/dateUtils";
import { convertToRupees } from "@shared/utils/utils";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Eye,
  Image,
  Info,
  ListFilter,
  PackagePlus,
  Search
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setProductId = useProductsStore((state) => state.setProductId);

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

  // keybindings state ↑ ↓
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  // mouse hover state -> shows img preview
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // triggers on mouse hover, not keyboard highlight
  const previewProduct =
    hoveredIndex !== null && hoveredIndex >= 0 ? searchResults[hoveredIndex] : null;

  const [delayedPreviewProduct, setDelayedPreviewProduct] = useState<typeof previewProduct | null>(
    null
  );

  // img preview debouncer
  useEffect(() => {
    if (!previewProduct || !previewProduct.imageUrl) {
      setDelayedPreviewProduct(null);
      return;
    }
    const timer = setTimeout(() => {
      setDelayedPreviewProduct(previewProduct);
    }, 150);
    return () => clearTimeout(timer);
  }, [previewProduct]);

  type SortField = "name" | "price" | "mrp";

  const sortBy = useSearchDropdownStore((state) => state.sortBy);
  const setSortBy = useSearchDropdownStore((state) => state.setSortBy);

  const toggleSort = (field: SortField) => {
    if (field === "name") {
      if (sortBy === PRODUCT_SORT_BY.NAME_ASC) setSortBy(PRODUCT_SORT_BY.NAME_DESC);
      else if (sortBy === PRODUCT_SORT_BY.NAME_DESC) setSortBy(null);
      else setSortBy(PRODUCT_SORT_BY.NAME_ASC);
    } else if (field === "price") {
      if (sortBy === PRODUCT_SORT_BY.PRICE_LOW_HIGH) setSortBy(PRODUCT_SORT_BY.PRICE_HIGH_LOW);
      else if (sortBy === PRODUCT_SORT_BY.PRICE_HIGH_LOW) setSortBy(null);
      else setSortBy(PRODUCT_SORT_BY.PRICE_LOW_HIGH);
    } else if (field === "mrp") {
      if (sortBy === PRODUCT_SORT_BY.MRP_LOW_HIGH) setSortBy(PRODUCT_SORT_BY.MRP_HIGH_LOW);
      else if (sortBy === PRODUCT_SORT_BY.MRP_HIGH_LOW) setSortBy(null);
      else setSortBy(PRODUCT_SORT_BY.MRP_LOW_HIGH);
    }
  };

  const getTooltipText = (field: SortField) => {
    if (field === "name") {
      if (sortBy === PRODUCT_SORT_BY.NAME_ASC) return "Sort Name (Z to A)";
      if (sortBy === PRODUCT_SORT_BY.NAME_DESC) return "Clear Name sort";
      return "Sort Name (A to Z)";
    }
    if (field === "price") {
      if (sortBy === PRODUCT_SORT_BY.PRICE_LOW_HIGH) return "Sort Price (High to Low)";
      if (sortBy === PRODUCT_SORT_BY.PRICE_HIGH_LOW) return "Clear Price sort";
      return "Sort Price (Low to High)";
    }
    if (field === "mrp") {
      if (sortBy === PRODUCT_SORT_BY.MRP_LOW_HIGH) return "Sort MRP (High to Low)";
      if (sortBy === PRODUCT_SORT_BY.MRP_HIGH_LOW) return "Clear MRP sort";
      return "Sort MRP (Low to High)";
    }
    return "";
  };

  const getSortDir = (field: SortField): "asc" | "desc" | null => {
    if (field === "name") {
      if (sortBy === PRODUCT_SORT_BY.NAME_ASC) return "asc";
      if (sortBy === PRODUCT_SORT_BY.NAME_DESC) return "desc";
    } else if (field === "price") {
      if (sortBy === PRODUCT_SORT_BY.PRICE_LOW_HIGH) return "asc";
      if (sortBy === PRODUCT_SORT_BY.PRICE_HIGH_LOW) return "desc";
    } else if (field === "mrp") {
      if (sortBy === PRODUCT_SORT_BY.MRP_LOW_HIGH) return "asc";
      if (sortBy === PRODUCT_SORT_BY.MRP_HIGH_LOW) return "desc";
    }
    return null;
  };

  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({ display: "none" });

  const updatePreviewPosition = useCallback(() => {
    if (!delayedPreviewProduct || !dropdownContainerRef.current) {
      setPreviewStyle({ display: "none" });
      return;
    }

    // get the html element
    const rowEl = dropdownContainerRef.current.querySelector(
      `[data-search-dropdown-index="${hoveredIndex}"]`
    );

    if (rowEl && parentRef.current) {
      const rowRect = rowEl.getBoundingClientRect();
      const dropdownRect = dropdownContainerRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      // check if row is visible within the scroll container
      if (rowRect.bottom < parentRect.top || rowRect.top > parentRect.bottom) {
        setPreviewStyle({ display: "none" });
        return;
      }

      // img preview card
      const PREVIEW_SIZE = 144;
      setPreviewStyle({
        position: "fixed",
        top: rowRect.top + rowRect.height / 2 - PREVIEW_SIZE / 2,
        left: dropdownRect.left - 12 - PREVIEW_SIZE,
        display: "block",
        zIndex: 9999
      });
    } else {
      setPreviewStyle({ display: "none" });
    }
  }, [delayedPreviewProduct, hoveredIndex, parentRef]);

  useEffect(() => {
    updatePreviewPosition();
    const parentEl = parentRef.current;
    if (parentEl) {
      parentEl.addEventListener("scroll", updatePreviewPosition);
      window.addEventListener("resize", updatePreviewPosition);
      return () => {
        parentEl.removeEventListener("scroll", updatePreviewPosition);
        window.removeEventListener("resize", updatePreviewPosition);
      };
    }
    return undefined;
  }, [updatePreviewPosition, parentRef]);

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
  // only reset highlight when the result count actually changes
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
        <AnimatePresence>
          {delayedPreviewProduct && delayedPreviewProduct.imageUrl && (
            <motion.div
              key={delayedPreviewProduct.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              style={previewStyle}
            >
              <div className="relative h-36 w-36">
                <div className="h-full w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/6">
                  <img
                    src={`${PROTOCOL_NAME}${delayedPreviewProduct.imageUrl}`}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                {delayedPreviewProduct.weight && (
                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    className="bg-foreground text-card font-roboto absolute -right-1.5 -bottom-3 rounded-lg px-3 py-1 text-base font-bold tracking-tight whitespace-nowrap shadow-md"
                  >
                    {delayedPreviewProduct.weight}
                    {delayedPreviewProduct.unit}
                  </motion.div>
                )}

                {/* img preview tail */}
                <div className="bg-card absolute top-1/2 -right-1.25 -z-10 h-3.5 w-3.5 -translate-y-1/2 rotate-45 shadow-[2px_-2px_4px_rgba(0,0,0,0.06)]"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={dropdownContainerRef}
          className="bg-background border-border/80 absolute top-[calc(100%+0.5rem)] left-[10.7%] z-30 flex max-h-96 w-[63%] flex-col overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
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
              <div className="border-border/70 bg-background flex shrink-0 items-center gap-3 border-b px-3.5 py-2">
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm font-semibold">
                  <ListFilter className="h-3.5 w-3.5" />
                  Sort by
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { field: "name" as SortField, label: "Name" },
                      { field: "price" as SortField, label: "Price" },
                      { field: "mrp" as SortField, label: "MRP" }
                    ] satisfies { field: SortField; label: string }[]
                  ).map(({ field, label }) => {
                    const sortDir = getSortDir(field);
                    const isActive = sortDir !== null;
                    return (
                      <Tooltip key={field} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <button
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
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {getTooltipText(field)}
                        </TooltipContent>
                      </Tooltip>
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
                          data-search-dropdown-index={virtualRow.index}
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
                            onMouseEnter={() => setHoveredIndex(virtualRow.index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            <div className="bg-muted/30 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
                              {product.imageUrl ? (
                                <img
                                  src={`${PROTOCOL_NAME}${product.imageUrl}`}
                                  alt={product.name || "Product"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Image
                                  className="text-muted-foreground/25 h-4 w-4"
                                  strokeWidth={1.25}
                                />
                              )}
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
                                          className="border-search-badge-weight-border bg-search-badge-weight-bg text-search-badge-weight-text rounded-full px-2.5 py-0.5 text-base font-semibold shadow-sm"
                                        >
                                          {product.weight}
                                          {product.unit}
                                        </Badge>
                                      )}
                                    {product.mrp && (
                                      <Badge
                                        variant="outline"
                                        className="border-search-badge-mrp-border bg-search-badge-mrp-bg text-search-badge-mrp-text rounded-full px-2.5 py-0.5 text-base font-semibold shadow-sm"
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

                            <div className="flex shrink-0 items-center gap-1.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground h-9 w-9 shrink-0 cursor-pointer rounded-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductId(product.id);
                                      setActionType(ACTION_TYPE.BILLING_PAGE_EDIT);
                                      setDialogMode(DIALOG_MODE.VIEW);
                                      setFormDataState({});
                                      setOpenProductDialog();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Eye className="h-4.5 w-4.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">View Details</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground h-9 w-9 shrink-0 cursor-pointer rounded-lg transition-all duration-150 active:scale-[0.95]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductId(product.id);
                                      setActionType(ACTION_TYPE.BILLING_PAGE_EDIT);
                                      setDialogMode(DIALOG_MODE.EDIT);
                                      setFormDataState({});
                                      setOpenProductDialog();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Edit className="h-4.5 w-4.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Edit Product</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground/70 hover:text-foreground h-9 w-9 shrink-0 cursor-pointer rounded-lg"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Info className="h-4.5 w-4.5" />
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
