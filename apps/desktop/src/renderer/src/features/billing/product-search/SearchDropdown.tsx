import { ErrorState } from "@/components/app-ui/ErrorState";
import { HighlightedText } from "@/components/app-ui/highlighted-text";
import { ProductImage } from "@/components/app-ui/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProductImageUrl, ignoredWeight } from "@/constants/renderer.constants";
import { focusFirstEmptyLineItem } from "@/features/billing/billingFocus";
import { useSearchDropdownStore } from "@/features/billing/product-search/searchDropdown.store";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { processSyncQueue } from "@/features/billing/syncWorker";
import {
  BILLING_PRODUCT_SEARCH_ROW_HEIGHT,
  PRODUCTSEARCH_TYPE,
  useProductSearch
} from "@/features/products/hooks/useProductSearch";
import { useProductsStore } from "@/features/products/products.store";
import { ACTION_TYPE, DIALOG_MODE, PRODUCT_SORT_BY } from "@shared/types";
import { formatDateStr } from "@shared/utils/dateUtils";
import { paisaToRupeeString } from "@shared/utils/utils";
import { ArrowDown, ArrowUp, Edit, Eye, Info, ListFilter, PackagePlus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from "react";

const SEARCH_DROPDOWN_SIZE_STORAGE_KEY = "quickcart-billing-product-search-size-v1";
const SEARCH_DROPDOWN_DEFAULT_WIDTH = 820;
const SEARCH_DROPDOWN_DEFAULT_HEIGHT = 396;
const SEARCH_DROPDOWN_MIN_WIDTH = 480;
const SEARCH_DROPDOWN_MAX_WIDTH = 1080;
const SEARCH_DROPDOWN_MIN_HEIGHT = 220;
const SEARCH_DROPDOWN_MAX_HEIGHT = 640;
const SEARCH_DROPDOWN_VIEWPORT_INSET = 12;
const KEYBOARD_SCROLL_AHEAD = 2;

type DropdownSize = { width: number; height: number };
type DropdownResizeAxis = "width" | "height" | "both";
type DropdownResizeInteraction = {
  axis: DropdownResizeAxis;
  startClientX: number;
  startClientY: number;
  startSize: DropdownSize;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const readDropdownSize = (): DropdownSize => {
  try {
    const savedSize = window.localStorage.getItem(SEARCH_DROPDOWN_SIZE_STORAGE_KEY);
    if (!savedSize) {
      return {
        width: SEARCH_DROPDOWN_DEFAULT_WIDTH,
        height: SEARCH_DROPDOWN_DEFAULT_HEIGHT
      };
    }

    const parsed = JSON.parse(savedSize) as Partial<DropdownSize>;
    return {
      width:
        typeof parsed.width === "number" && Number.isFinite(parsed.width)
          ? clamp(parsed.width, SEARCH_DROPDOWN_MIN_WIDTH, SEARCH_DROPDOWN_MAX_WIDTH)
          : SEARCH_DROPDOWN_DEFAULT_WIDTH,
      height:
        typeof parsed.height === "number" && Number.isFinite(parsed.height)
          ? clamp(parsed.height, SEARCH_DROPDOWN_MIN_HEIGHT, SEARCH_DROPDOWN_MAX_HEIGHT)
          : SEARCH_DROPDOWN_DEFAULT_HEIGHT
    };
  } catch {
    return {
      width: SEARCH_DROPDOWN_DEFAULT_WIDTH,
      height: SEARCH_DROPDOWN_DEFAULT_HEIGHT
    };
  }
};

const saveDropdownSize = ({ width, height }: DropdownSize) => {
  try {
    window.localStorage.setItem(
      SEARCH_DROPDOWN_SIZE_STORAGE_KEY,
      JSON.stringify({ width: Math.round(width), height: Math.round(height) })
    );
  } catch {
    // Resizing remains available if local storage is unavailable.
  }
};

const getDropdownResizeBounds = (element: HTMLElement) => {
  const elementRect = element.getBoundingClientRect();
  const billingScrollContainer = element.closest<HTMLElement>("[data-billing-scroll-container]");
  const scrollViewportRect = billingScrollContainer?.getBoundingClientRect();
  const visibleBottom =
    Math.min(scrollViewportRect?.bottom ?? window.innerHeight, window.innerHeight) -
    SEARCH_DROPDOWN_VIEWPORT_INSET;
  const availableWidth = Math.max(
    160,
    window.innerWidth - SEARCH_DROPDOWN_VIEWPORT_INSET - elementRect.left
  );
  const availableHeight = Math.max(120, visibleBottom - elementRect.top);
  const maxWidth = Math.min(SEARCH_DROPDOWN_MAX_WIDTH, availableWidth);
  const maxHeight = Math.min(SEARCH_DROPDOWN_MAX_HEIGHT, availableHeight);

  return {
    minWidth: Math.min(SEARCH_DROPDOWN_MIN_WIDTH, maxWidth),
    maxWidth,
    minHeight: Math.min(SEARCH_DROPDOWN_MIN_HEIGHT, maxHeight),
    maxHeight
  };
};

const SearchDropdown = ({ rowId }: { rowId: string }) => {
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
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
    virtualItems,
    isError,
    isFetchNextPageError,
    refetch
  } = useProductSearch(PRODUCTSEARCH_TYPE.BILLINGPAGE);

  // keybindings state ↑ ↓
  const [highlightedIndex, setHighlightedIndex] = useState<number>(() =>
    itemQuery.trim() ? 0 : -1
  );
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
  const [savedDropdownSize] = useState(readDropdownSize);
  const preferredDropdownSizeRef = useRef(savedDropdownSize);
  const resizeInteractionRef = useRef<DropdownResizeInteraction | null>(null);

  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({ display: "none" });
  const [dropdownLayout, setDropdownLayout] = useState({
    width: savedDropdownSize.width,
    height: savedDropdownSize.height,
    left: 0
  });

  const updateDropdownLayout = useCallback(() => {
    const element = dropdownContainerRef.current;
    if (!element || resizeInteractionRef.current) return;

    const anchorRect = dropdownRef.current?.getBoundingClientRect();
    const billingScrollContainer = element.closest<HTMLElement>("[data-billing-scroll-container]");
    const anchorLeft = anchorRect?.left ?? element.getBoundingClientRect().left;
    const anchoredVisualLeft = Math.max(anchorLeft, SEARCH_DROPDOWN_VIEWPORT_INSET);
    const availableVisualWidth = Math.max(
      160,
      window.innerWidth - SEARCH_DROPDOWN_VIEWPORT_INSET - anchoredVisualLeft
    );
    const scrollViewportHeight = Math.min(
      billingScrollContainer?.clientHeight ?? window.innerHeight,
      window.innerHeight
    );
    const availableHeight = Math.max(
      120,
      scrollViewportHeight - SEARCH_DROPDOWN_VIEWPORT_INSET * 2
    );
    const maxWidth = Math.min(SEARCH_DROPDOWN_MAX_WIDTH, availableVisualWidth);
    const maxHeight = Math.min(SEARCH_DROPDOWN_MAX_HEIGHT, availableHeight);
    const preferredSize = preferredDropdownSizeRef.current;

    setDropdownLayout({
      width: clamp(preferredSize.width, Math.min(SEARCH_DROPDOWN_MIN_WIDTH, maxWidth), maxWidth),
      height: clamp(
        preferredSize.height,
        Math.min(SEARCH_DROPDOWN_MIN_HEIGHT, maxHeight),
        maxHeight
      ),
      left: anchoredVisualLeft - anchorLeft
    });
  }, [dropdownRef]);

  const startDropdownResize = (axis: DropdownResizeAxis, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    resizeInteractionRef.current = {
      axis,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startSize: {
        width: dropdownLayout.width,
        height: dropdownLayout.height
      }
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      axis === "width" ? "ew-resize" : axis === "height" ? "ns-resize" : "nwse-resize";
  };

  const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const element = dropdownContainerRef.current;
    if (!element) return;

    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 32 : 12;
    const bounds = getDropdownResizeBounds(element);

    setDropdownLayout((current) => {
      const nextSize = {
        width: clamp(
          current.width +
            (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0),
          bounds.minWidth,
          bounds.maxWidth
        ),
        height: clamp(
          current.height + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0),
          bounds.minHeight,
          bounds.maxHeight
        )
      };
      preferredDropdownSizeRef.current = nextSize;
      saveDropdownSize(nextSize);
      return { ...current, ...nextSize };
    });
  };

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
      const previewSize = Math.min(144, availableViewportSize, leftSpace);

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
  }, [delayedPreviewProduct, parentRef, previewIndex]);

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

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = resizeInteractionRef.current;
      const element = dropdownContainerRef.current;
      if (!interaction || !element) return;

      const bounds = getDropdownResizeBounds(element);
      const changesWidth = interaction.axis === "width" || interaction.axis === "both";
      const changesHeight = interaction.axis === "height" || interaction.axis === "both";
      const nextSize = {
        width: changesWidth
          ? clamp(
              interaction.startSize.width + event.clientX - interaction.startClientX,
              bounds.minWidth,
              bounds.maxWidth
            )
          : interaction.startSize.width,
        height: changesHeight
          ? clamp(
              interaction.startSize.height + event.clientY - interaction.startClientY,
              bounds.minHeight,
              bounds.maxHeight
            )
          : interaction.startSize.height
      };

      preferredDropdownSizeRef.current = nextSize;
      setDropdownLayout((current) => ({ ...current, ...nextSize }));
    };

    const finishResize = () => {
      if (!resizeInteractionRef.current) return;
      resizeInteractionRef.current = null;
      saveDropdownSize(preferredDropdownSizeRef.current);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  // The virtualized results settle after the first render, so observe the real dropdown size
  // instead of relying on a one-time measurement that can run too early.
  useEffect(() => {
    const element = dropdownContainerRef.current;
    const billingScrollContainer = element?.closest<HTMLElement>("[data-billing-scroll-container]");
    if (!element || !billingScrollContainer) return;

    let frame: number | null = null;
    const revealDropdown = () => {
      if (resizeInteractionRef.current) return;
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const dropdownRect = element.getBoundingClientRect();
        const scrollViewportRect = billingScrollContainer.getBoundingClientRect();
        const viewportInset = 12;
        const visibleBottom =
          Math.min(scrollViewportRect.bottom, window.innerHeight) - viewportInset;
        const requiredScroll = Math.max(0, dropdownRect.bottom - visibleBottom);
        if (requiredScroll <= 1) return;

        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth";
        billingScrollContainer.scrollBy({ top: requiredScroll, behavior });
      });
    };

    const observer = new ResizeObserver(revealDropdown);
    observer.observe(element);
    revealDropdown();

    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  const openNewProductDialog = () => {
    setIsDropdownOpen(false);
    setProductId(null);
    setFormDataState({});
    setDialogMode("edit");
    setActionType("add");
    setOpenProductDialog(true);
  };
  // Reset the highlight for a new search, but preserve it while infinite pages append.
  const searchContextRef = useRef({
    query: itemQuery,
    sortBy,
    resultCount: searchResults.length
  });
  useEffect(() => {
    const previousContext = searchContextRef.current;
    const searchContextChanged =
      previousContext.query !== itemQuery || previousContext.sortBy !== sortBy;
    const resultsReplaced = searchResults.length < previousContext.resultCount;
    const resultsBecameAvailable = previousContext.resultCount === 0 && searchResults.length > 0;

    if (searchContextChanged || resultsReplaced || resultsBecameAvailable) {
      setHighlightedIndex(itemQuery.trim() ? 0 : -1);
    } else if (searchResults.length === 0) {
      setHighlightedIndex(-1);
    }

    searchContextRef.current = {
      query: itemQuery,
      sortBy,
      resultCount: searchResults.length
    };
  }, [itemQuery, searchResults.length, sortBy]);

  useEffect(() => {
    if (virtualItems.length === 0) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    const totalRows = hasNextPage ? searchResults.length + 1 : searchResults.length;
    if (
      lastItem &&
      lastItem.index >= totalRows - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    searchResults.length
  ]);

  const selectProduct = useCallback(
    (index: number) => {
      const product = searchResults[index];
      if (!product || !activeTabId) return;
      addLineItem(activeTabId, rowId, product);
      setItemQuery(product.productSnapshot);
      setIsDropdownOpen(false);
      addEmptyLineItem(activeTabId);
      processSyncQueue(activeTabId);
      focusFirstEmptyLineItem(activeTabId);
    },
    [
      searchResults,
      activeTabId,
      rowId,
      addLineItem,
      setItemQuery,
      setIsDropdownOpen,
      addEmptyLineItem
    ]
  );

  const searchResultsLengthRef = useRef(searchResults.length);
  searchResultsLengthRef.current = searchResults.length;

  const scrollToKeyboardIndex = useCallback(
    (index: number, direction: "up" | "down") => {
      const scrollElement = parentRef.current;
      const currentItem = rowVirtualizer
        .getVirtualItems()
        .find((virtualItem) => virtualItem.index === index);

      if (!scrollElement || !currentItem) {
        rowVirtualizer.scrollToIndex(index, { align: "center", behavior: "auto" });
        return;
      }

      const lookaheadDistance = currentItem.size * KEYBOARD_SCROLL_AHEAD;
      const viewportTop = scrollElement.scrollTop;
      const viewportBottom = viewportTop + scrollElement.clientHeight;

      if (direction === "down" && currentItem.end + lookaheadDistance > viewportBottom) {
        rowVirtualizer.scrollToIndex(
          Math.min(index + KEYBOARD_SCROLL_AHEAD, searchResultsLengthRef.current - 1),
          { align: "end", behavior: "auto" }
        );
        return;
      }

      if (direction === "up" && currentItem.start - lookaheadDistance < viewportTop) {
        rowVirtualizer.scrollToIndex(Math.max(index - KEYBOARD_SCROLL_AHEAD, 0), {
          align: "start",
          behavior: "auto"
        });
        return;
      }

      rowVirtualizer.scrollToIndex(index, { align: "auto", behavior: "auto" });
    },
    [parentRef, rowVirtualizer]
  );

  const navigationDirectionRef = useRef<"up" | "down">("down");

  useEffect(() => {
    if (!isKeyboardNavigating || highlightedIndex < 0) return;
    scrollToKeyboardIndex(highlightedIndex, navigationDirectionRef.current);
  }, [highlightedIndex, isKeyboardNavigating, scrollToKeyboardIndex]);

  // arrow keys navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const len = searchResults.length;
      if (len === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHoveredIndex(null);
        setIsKeyboardNavigating(true);
        navigationDirectionRef.current = "down";
        setHighlightedIndex((prev) => Math.min(prev + 1, len - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHoveredIndex(null);
        setIsKeyboardNavigating(true);
        navigationDirectionRef.current = "up";
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndexRef.current >= 0) {
          selectProduct(highlightedIndexRef.current);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchResults, scrollToKeyboardIndex, selectProduct]);

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
            width: dropdownLayout.width,
            height: dropdownLayout.height,
            maxHeight: dropdownLayout.height,
            left: dropdownLayout.left
          }}
          className="bg-background border-frame absolute top-[calc(100%+0.5rem)] z-30 flex flex-col overflow-hidden rounded-(--radius-panel) border shadow-md"
        >
          {isError && searchResults.length === 0 ? (
            <ErrorState
              layout="compact"
              className="m-2"
              title="Products could not be loaded"
              description="Try loading product matches again."
              primaryAction={{ label: "Try again", onClick: () => void refetch() }}
            />
          ) : searchResults.length === 0 ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center px-3 py-8 text-center">
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
              <div className="border-border bg-background flex h-7 shrink-0 items-center gap-1.5 border-b px-1.5">
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
                            className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-(--radius-control) px-2 text-xs font-semibold transition-colors ${
                              isActive
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:bg-hover hover:text-foreground"
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

              <div ref={parentRef} className="scrollbar-thick flex-1 overflow-y-auto px-0.5">
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

                      const showWeight =
                        product.weight !== null &&
                        ignoredWeight.some((weight) =>
                          (String(product.weight) + "+" + product.unit).includes(weight)
                        );

                      return (
                        <div
                          key={virtualRow.key}
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          data-search-dropdown-index={virtualRow.index}
                        >
                          <div
                            className={`group relative flex items-center gap-1.5 rounded-(--radius-control) px-1 transition-colors duration-150 hover:cursor-pointer ${
                              highlightedIndex === virtualRow.index
                                ? "bg-selected text-foreground hover:bg-selected"
                                : "hover:bg-hover hover:text-foreground"
                            }`}
                            style={{ height: BILLING_PRODUCT_SEARCH_ROW_HEIGHT }}
                            onClick={() => selectProduct(virtualRow.index)}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => {
                              setIsKeyboardNavigating(false);
                              setHoveredIndex(virtualRow.index);
                            }}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            <span
                              aria-hidden="true"
                              className={`bg-marker absolute top-0 left-0 h-full w-1 rounded-r-full transition-opacity ${
                                highlightedIndex === virtualRow.index ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <ProductImage
                              src={product.imageUrl ? getProductImageUrl(product.imageUrl) : null}
                              alt={product.name || "Product"}
                              className="border-border bg-card size-9 shrink-0 border"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-1">
                                <h4
                                  className="text-foreground min-w-0 truncate text-base font-semibold"
                                  title={product.name}
                                >
                                  <HighlightedText text={product.name} query={itemQuery} />
                                </h4>
                                {showWeight && (
                                  <Badge
                                    variant="outline"
                                    className="border-unit-tag-border bg-unit-tag-bg text-unit-tag-text h-6 shrink-0 rounded-(--radius-control) px-1.5 py-0 text-sm leading-none font-semibold shadow-none"
                                  >
                                    {product.weight}
                                    {product.unit}
                                  </Badge>
                                )}
                                {product.mrp && (
                                  <Badge
                                    variant="outline"
                                    className="border-mrp-tag-border bg-mrp-tag-bg text-mrp-tag-text h-6 shrink-0 rounded-(--radius-control) px-1.5 py-0 text-sm leading-none font-semibold tabular-nums shadow-none"
                                  >
                                    MRP ₹{paisaToRupeeString(product.mrp)}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-foreground shrink-0 text-right text-lg font-bold tabular-nums">
                              ₹ {paisaToRupeeString(product.price)}
                            </div>

                            <div
                              className="flex shrink-0 items-center gap-1"
                              onMouseEnter={() => setHoveredIndex(null)}
                              onMouseLeave={() => setHoveredIndex(virtualRow.index)}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label={`View ${product.name}`}
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductId(product.id);
                                      setActionType(ACTION_TYPE.BILLING_PAGE_EDIT);
                                      setDialogMode(DIALOG_MODE.VIEW);
                                      setFormDataState({});
                                      setOpenProductDialog(true);
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
                                    aria-label={`Edit ${product.name}`}
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductId(product.id);
                                      setActionType(ACTION_TYPE.BILLING_PAGE_EDIT);
                                      setDialogMode(DIALOG_MODE.EDIT);
                                      setFormDataState({});
                                      setOpenProductDialog(true);
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
                                    aria-label={`Product information for ${product.name}`}
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Info className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-xs leading-relaxed">
                                  <p>
                                    Updated:{" "}
                                    {product.updatedAt ? formatDateStr(product.updatedAt) : "—"}
                                  </p>
                                  <p>
                                    Created:{" "}
                                    {product.createdAt ? formatDateStr(product.createdAt) : "—"}
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
                {isFetchNextPageError && (
                  <div className="border-border flex items-center justify-between border-t px-2 py-2 text-xs">
                    <span className="text-muted-foreground">
                      More products could not be loaded.
                    </span>
                    <Button size="sm" variant="outline" onClick={() => void fetchNextPage()}>
                      Try again
                    </Button>
                  </div>
                )}
                {!hasNextPage && searchResults.length > 0 && (
                  <div className="text-muted-foreground py-2 text-center text-xs">
                    End of results
                  </div>
                )}
              </div>
            </>
          )}

          <div
            aria-hidden="true"
            onPointerDown={(event) => startDropdownResize("width", event)}
            className="hover:bg-border/60 absolute top-1 right-0 bottom-5 z-40 w-1.5 cursor-ew-resize touch-none transition-colors"
          />
          <div
            aria-hidden="true"
            onPointerDown={(event) => startDropdownResize("height", event)}
            className="hover:bg-border/60 absolute right-5 bottom-0 left-1 z-40 h-1.5 cursor-ns-resize touch-none transition-colors"
          />
          <button
            type="button"
            aria-label="Resize product search results"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            title="Drag to resize. Use arrow keys for precise sizing."
            onPointerDown={(event) => startDropdownResize("both", event)}
            onKeyDown={handleResizeKeyDown}
            className="border-border bg-background hover:bg-hover focus-visible:ring-focus/60 absolute right-0 bottom-0 z-50 flex size-5 cursor-nwse-resize touch-none items-end justify-end rounded-tl-sm border-t border-l p-1 outline-none focus-visible:ring-2"
          >
            <span
              aria-hidden="true"
              className="border-foreground/60 size-2 border-r-2 border-b-2"
            />
          </button>
        </div>
      </div>
    </>
  );
};

export default SearchDropdown;
