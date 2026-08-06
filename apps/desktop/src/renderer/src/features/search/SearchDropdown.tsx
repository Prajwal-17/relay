import { ProductImage } from "@/components/app-ui/product-image";
import { HighlightedText } from "@/components/highlighted-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProductImageUrl, ignoredWeight } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { ACTION_TYPE, DIALOG_MODE, PRODUCT_SORT_BY } from "@shared/types";
import { formatDateStr } from "@shared/utils/dateUtils";
import { paisaToRupeeString } from "@shared/utils/utils";
import { ArrowDown, ArrowUp, Edit, Eye, Info, ListFilter, PackagePlus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SEARCH_DROPDOWN_MAX_HEIGHT = 440;

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

  const { config } = useAppPreferences();
  const scale = config?.billing?.searchDropdown?.scale ?? 1;

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
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const previewIndex =
    hoveredIndex ?? (isKeyboardNavigating && highlightedIndex >= 0 ? highlightedIndex : null);
  const previewProduct =
    previewIndex !== null && previewIndex >= 0 ? searchResults[previewIndex] : null;

  const [delayedPreviewProduct, setDelayedPreviewProduct] = useState<typeof previewProduct | null>(
    null
  );
  const loadedPreviewUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!previewProduct || !previewProduct.imageUrl) {
      setDelayedPreviewProduct(null);
      return;
    }

    setDelayedPreviewProduct(null);
    const previewUrl = getProductImageUrl(previewProduct.imageUrl);
    let delayElapsed = false;
    let imageLoaded = loadedPreviewUrlsRef.current.has(previewUrl);
    let cancelled = false;
    let image: HTMLImageElement | null = null;

    const revealPreview = () => {
      if (!cancelled && delayElapsed && imageLoaded) setDelayedPreviewProduct(previewProduct);
    };

    const timer = setTimeout(
      () => {
        delayElapsed = true;
        revealPreview();
      },
      isKeyboardNavigating ? 0 : 120
    );

    const handleLoad = () => {
      imageLoaded = true;
      loadedPreviewUrlsRef.current.add(previewUrl);
      revealPreview();
    };

    const handleError = () => {
      if (!cancelled) setDelayedPreviewProduct(null);
    };

    if (!imageLoaded) {
      image = new window.Image();
      image.addEventListener("load", handleLoad, { once: true });
      image.addEventListener("error", handleError, { once: true });
      image.src = previewUrl;
      if (image.complete && image.naturalWidth > 0) handleLoad();
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
      image?.removeEventListener("load", handleLoad);
      image?.removeEventListener("error", handleError);
    };
  }, [isKeyboardNavigating, previewProduct]);

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
  const hasAdjustedWorkspaceScrollRef = useRef(false);

  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({ display: "none" });
  const [dropdownLayout, setDropdownLayout] = useState({
    width: 704,
    maxHeight: SEARCH_DROPDOWN_MAX_HEIGHT,
    left: 0
  });

  const updateDropdownLayout = useCallback(() => {
    const element = dropdownContainerRef.current;
    if (!element) return;

    const anchorRect = dropdownRef.current?.getBoundingClientRect();
    const billingScrollContainer = element.closest<HTMLElement>("[data-billing-scroll-container]");
    const viewportInset = 12;
    const anchorLeft = anchorRect?.left ?? element.getBoundingClientRect().left;
    const availableViewportWidth = Math.max(160, window.innerWidth - viewportInset * 2);
    const width = Math.min(704, availableViewportWidth / scale);
    const visualWidth = width * scale;
    const clampedVisualLeft = Math.min(
      Math.max(anchorLeft, viewportInset),
      window.innerWidth - viewportInset - visualWidth
    );
    const scrollViewportHeight = billingScrollContainer?.clientHeight ?? window.innerHeight;
    const availableHeight = Math.max(180, (scrollViewportHeight - viewportInset * 2) / scale);

    setDropdownLayout({
      width,
      maxHeight: Math.min(SEARCH_DROPDOWN_MAX_HEIGHT, availableHeight),
      left: (clampedVisualLeft - anchorLeft) / scale
    });
  }, [dropdownRef, scale]);

  const updatePreviewPosition = useCallback(() => {
    if (!delayedPreviewProduct || !dropdownContainerRef.current) {
      setPreviewStyle({ display: "none" });
      return;
    }

    // get the html element
    const rowEl = dropdownContainerRef.current.querySelector(
      `[data-search-dropdown-index="${previewIndex}"]`
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

      const viewportInset = 12;
      const previewGap = 8;
      const availableViewportSize = Math.max(
        64,
        Math.min(window.innerWidth - viewportInset * 2, window.innerHeight - viewportInset * 2)
      );
      const leftSpace = dropdownRect.left - viewportInset - previewGap;
      const previewSize = Math.min(144 * scale, availableViewportSize, leftSpace);

      if (previewSize < 80) {
        setPreviewStyle({ display: "none" });
        return;
      }

      const centeredTop = rowRect.top + rowRect.height / 2 - previewSize / 2;
      const top = Math.min(
        Math.max(centeredTop, viewportInset),
        window.innerHeight - viewportInset - previewSize
      );

      const left = dropdownRect.left - previewGap - previewSize;

      setPreviewStyle({
        position: "fixed",
        top,
        left,
        width: previewSize,
        height: previewSize,
        display: "block",
        zIndex: 9999
      });
    } else {
      setPreviewStyle({ display: "none" });
    }
  }, [delayedPreviewProduct, parentRef, previewIndex, scale]);

  useEffect(() => {
    updatePreviewPosition();
    const parentEl = parentRef.current;
    const billingScrollContainer = dropdownContainerRef.current?.closest<HTMLElement>(
      "[data-billing-scroll-container]"
    );

    parentEl?.addEventListener("scroll", updatePreviewPosition);
    billingScrollContainer?.addEventListener("scroll", updatePreviewPosition);
    window.addEventListener("resize", updatePreviewPosition);

    return () => {
      parentEl?.removeEventListener("scroll", updatePreviewPosition);
      billingScrollContainer?.removeEventListener("scroll", updatePreviewPosition);
      window.removeEventListener("resize", updatePreviewPosition);
    };
  }, [updatePreviewPosition, parentRef]);

  useEffect(() => {
    updateDropdownLayout();
    window.addEventListener("resize", updateDropdownLayout);
    return () => window.removeEventListener("resize", updateDropdownLayout);
  }, [updateDropdownLayout]);

  // Keep the result viewport stable and move the billing workspace only as much as needed.
  useEffect(() => {
    if (hasAdjustedWorkspaceScrollRef.current || searchResults.length === 0) return;

    const el = dropdownContainerRef.current;
    const billingScrollContainer = el?.closest<HTMLElement>("[data-billing-scroll-container]");
    if (!el || !billingScrollContainer) return;

    const frame = window.requestAnimationFrame(() => {
      const dropdownRect = el.getBoundingClientRect();
      const scrollViewportRect = billingScrollContainer.getBoundingClientRect();
      const viewportInset = 12;
      const visibleBottom = Math.min(scrollViewportRect.bottom, window.innerHeight) - viewportInset;
      const requiredScroll = Math.max(0, dropdownRect.bottom - visibleBottom);

      hasAdjustedWorkspaceScrollRef.current = true;
      if (requiredScroll > 0) {
        billingScrollContainer.scrollBy({ top: requiredScroll, behavior: "smooth" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [searchResults.length]);

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
        setHoveredIndex(null);
        setIsKeyboardNavigating(true);
        setHighlightedIndex((prev) => {
          const next = Math.min(prev + 1, len - 1);
          rowVirtualizer.scrollToIndex(next, { align: "auto" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHoveredIndex(null);
        setIsKeyboardNavigating(true);
        setHighlightedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              style={previewStyle}
              className="pointer-events-none"
            >
              <div className="bg-background h-full w-full overflow-hidden rounded-(--radius-panel) shadow-md">
                <img
                  src={getProductImageUrl(delayedPreviewProduct.imageUrl)}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={dropdownContainerRef}
          style={{
            zoom: scale,
            width: dropdownLayout.width,
            maxHeight: dropdownLayout.maxHeight,
            left: dropdownLayout.left
          }}
          className="bg-background border-frame absolute top-[calc(100%+0.5rem)] z-30 flex flex-col overflow-hidden rounded-(--radius-panel) border shadow-md"
        >
          {searchResults.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center px-5 py-8 text-center">
              <div className="bg-secondary mb-3 flex size-10 items-center justify-center rounded-(--radius-control)">
                <Search className="size-5" />
              </div>
              <h3 className="text-foreground mb-1 text-sm font-semibold">No products found</h3>
              <p className="mb-4 max-w-sm text-xs">
                Add the product now and continue billing without leaving this screen.
              </p>
              <Button variant="outline" size="sm" onClick={openNewProductDialog}>
                <PackagePlus className="size-3.5" />
                New Product
              </Button>
            </div>
          ) : (
            <>
              <div className="border-border bg-background flex h-8 shrink-0 items-center gap-2 border-b px-3">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
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
                            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-(--radius-control) px-2.5 text-xs font-semibold transition-colors ${
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

              <div ref={parentRef} className="flex-1 overflow-y-auto scroll-smooth px-1">
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
                            className={`group relative flex h-[54px] items-center gap-2.5 rounded-(--radius-control) px-3 transition-colors duration-150 hover:cursor-pointer ${
                              highlightedIndex === virtualRow.index
                                ? "bg-accent"
                                : "hover:bg-accent"
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
                            onMouseEnter={() => {
                              setIsKeyboardNavigating(false);
                              setHoveredIndex(virtualRow.index);
                            }}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            <span
                              aria-hidden="true"
                              className={`bg-primary absolute top-0 left-0 h-full w-0.5 rounded-r-full transition-opacity ${
                                highlightedIndex === virtualRow.index ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <ProductImage
                              src={product.imageUrl ? getProductImageUrl(product.imageUrl) : null}
                              alt={product.name || "Product"}
                              className="size-10"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-2">
                                <h4 className="text-foreground min-w-0 truncate text-lg font-semibold">
                                  <HighlightedText text={product.name} query={itemQuery} />
                                </h4>
                                {product.weight !== null &&
                                  ignoredWeight.some((w) =>
                                    `${product.weight}+${product.unit}`.includes(w)
                                  ) && (
                                    <Badge
                                      variant="outline"
                                      className="border-border bg-muted text-muted-foreground shrink-0 rounded-md px-2 py-0.5 text-sm font-semibold shadow-sm"
                                    >
                                      {product.weight}
                                      {product.unit}
                                    </Badge>
                                  )}
                                {product.mrp && (
                                  <Badge
                                    variant="outline"
                                    className="border-badge-mrp-border bg-badge-mrp-bg text-badge-mrp-text shrink-0 rounded-full px-2 py-0.5 text-sm font-semibold shadow-sm"
                                  >
                                    MRP ₹{paisaToRupeeString(product.mrp)}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-success shrink-0 text-right text-xl font-bold tabular-nums">
                              ₹ {paisaToRupeeString(product.price)}
                            </div>

                            <div
                              className="flex shrink-0 items-center gap-1.5"
                              onMouseEnter={() => setHoveredIndex(null)}
                              onMouseLeave={() => setHoveredIndex(virtualRow.index)}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
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
                                    <Eye className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">View details</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
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
                                    <Edit className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Edit product</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Info className="size-4" />
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
                  <div className="text-muted-foreground py-3 text-center text-xs">
                    End of results
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
