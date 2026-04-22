import { Card } from "@/components/ui/card";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useProductsStore } from "@/store/productsStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LoaderCircle, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ProductGridItem from "./ProductGridItem";
import ProductListItem from "./ProductListItem";

const GRID_CARD_MIN_WIDTH = 240;
const GRID_CARD_GAP = 16;
const GRID_ROW_HEIGHT = 320;

export default function ProductResults() {
  const viewMode = useProductsStore((state) => state.viewMode);

  const {
    searchResults,
    parentRef,
    rowVirtualizer,
    status,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useProductSearch(PRODUCTSEARCH_TYPE.PRODUCTPAGE);

  /**
   * ResizeObserver — tracks the container's width so we can calculate how many grid cards fit per row
   * Since virtualizer cannot understand grid it just knows a single vertical list
   */
  const [containerWidth, setContainerWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const scrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Wire up the virtualizer's scroll element ref
      (parentRef as React.RefObject<HTMLDivElement | null>).current = node;

      // Clean up old observer
      observerRef.current?.disconnect();

      if (node) {
        setContainerWidth(node.clientWidth);
        observerRef.current = new ResizeObserver(([entry]) => {
          setContainerWidth(entry.contentRect.width);
        });
        observerRef.current.observe(node);
      }
    },
    [parentRef]
  );

  // calc how many cards fit in one row
  const gridColumns = Math.max(
    1,
    Math.floor((containerWidth + GRID_CARD_GAP) / (GRID_CARD_MIN_WIDTH + GRID_CARD_GAP))
  );

  // total virtual rows for grid = ceil(products / columns) => 20/4 = 5rows
  const gridRowCount = Math.ceil(searchResults.length / gridColumns);

  // the correct total virtual row count for the current view mode
  const isGrid = viewMode === "grid";
  const totalVirtualRows = isGrid
    ? hasNextPage
      ? gridRowCount + 1
      : gridRowCount
    : hasNextPage
      ? searchResults.length + 1
      : searchResults.length;

  // dedicated virtualizer for Grid mode to prevent cache poisoning
  const gridVirtualizer = useVirtualizer({
    count: isGrid ? totalVirtualRows : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => GRID_ROW_HEIGHT,
    overscan: 2
  });

  // Pick the active virtualizer
  const activeVirtualizer = isGrid ? gridVirtualizer : rowVirtualizer;

  // Reset scroll position when switching view modes
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [viewMode, parentRef]);

  /**
   * Infinite scroll — fetch next page when the last visible virtual row is near the end
   * This effect MUST come AFTER the virtualizer options update above,
   * so it uses the correct grid-aware count instead of the hook's stale list-mode count
   */
  const virtualItems = activeVirtualizer.getVirtualItems();

  useEffect(() => {
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem && lastItem.index >= totalVirtualRows - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [totalVirtualRows, hasNextPage, isFetchingNextPage, fetchNextPage, virtualItems]);

  return (
    <Card className="border-border bg-background flex min-h-0 flex-1 flex-col border py-2 shadow-sm">
      {status === "pending" ? (
        <div className="my-8 flex justify-center gap-3">
          <div className="text-muted-foreground text-xl font-semibold">Loading</div>
          <LoaderCircle className="text-primary animate-spin" size={26} />
        </div>
      ) : (
        <>
          {searchResults.length === 0 ? (
            <div className="text-muted-foreground p-16 text-center">
              <Search className="mx-auto mb-6 h-16 w-16 opacity-30" />
              <h3 className="text-foreground mb-3 text-xl font-semibold">No products found</h3>
              <p className="text-muted-foreground font-medium">Try adjusting your search</p>
            </div>
          ) : (
            <div ref={scrollContainerRef} className="relative flex-1 overflow-auto scroll-smooth">
              {viewMode === "list" ? (
                /**
                 * LIST VIEW VIRTUALIZER
                 *
                 * Virtualizer works using 3 nested divs:
                 *  1. Outer div (scroll container) — fixed height, overflow:auto — provides the scrollable viewport
                 *  2. Spacer div — height = `rowVirtualizer.getTotalSize()` px
                 *       Creates the full scrollable area without rendering every row
                 *  3. Inner div — absolute positioned, translateY = first visible item's `start`
                 *       Renders only the visible items, each positioned from virtualItem.start
                 *
                 * Each virtual row = 1 product.
                 */
                <div
                  style={{
                    height: `${activeVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative"
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${activeVirtualizer.getVirtualItems()[0]?.start ?? 0}px)`
                    }}
                  >
                    {activeVirtualizer.getVirtualItems().map((virtualRow) => {
                      const product = searchResults[virtualRow.index];
                      if (!product) return null;
                      return (
                        <div
                          key={virtualRow.key}
                          ref={activeVirtualizer.measureElement}
                          data-index={virtualRow.index}
                        >
                          <ProductListItem product={product} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /**
                 * GRID VIEW VIRTUALIZER
                 *
                 * Same 3-div virtualizer structure as list, but each virtual row contains `gridColumns` products
                 *
                 * The virtualizer row index maps to a "grid row":
                 *   - Row 0 → products[0..gridColumns-1]
                 *   - Row 1 → products[gridColumns..2*gridColumns-1]
                 *   - etc.
                 *
                 * The column count is calculated from the container width using ResizeObserver so the grid stays responsive
                 */
                <div
                  style={{
                    height: `${activeVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative"
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${activeVirtualizer.getVirtualItems()[0]?.start ?? 0}px)`
                    }}
                  >
                    {activeVirtualizer.getVirtualItems().map((virtualRow) => {
                      const startIndex = virtualRow.index * gridColumns;
                      const rowProducts = searchResults.slice(startIndex, startIndex + gridColumns);

                      if (rowProducts.length === 0) return null;

                      return (
                        <div
                          key={virtualRow.key}
                          ref={activeVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          className="px-4 pb-4"
                        >
                          <div
                            className="grid"
                            style={{
                              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                              gap: `${GRID_CARD_GAP}px`
                            }}
                          >
                            {rowProducts.map((product) => (
                              <ProductGridItem key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!hasNextPage && searchResults.length > 0 && (
                <div className="text-muted-foreground flex flex-col items-center py-0 text-center">
                  <div className="text-2xl font-medium">No more products</div>
                  <p className="mt-2 text-base opacity-75">
                    You&apos;ve reached the end of the list
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
