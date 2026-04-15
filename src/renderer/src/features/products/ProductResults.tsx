import { Card } from "@/components/ui/card";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useProductsStore } from "@/store/productsStore";
import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProductGridItem from "./ProductGridItem";
import ProductListItem from "./ProductListItem";

const GRID_CARD_MIN_WIDTH = 240;
const GRID_CARD_GAP = 16;
const GRID_ROW_HEIGHT = 320;
const LIST_ROW_HEIGHT = 104;

export default function ProductResults() {
  const viewMode = useProductsStore((state) => state.viewMode);

  const { searchResults, parentRef, rowVirtualizer, status, virtualItems, hasNextPage } =
    useProductSearch(PRODUCTSEARCH_TYPE.PRODUCTPAGE);

  /**
   * ResizeObserver — tracks the scroll container's width so we can calculate
   * how many grid cards fit per row. The virtualizer needs this number in JS
   * because it groups N products into each virtual row for grid mode.
   */
  const [containerWidth, setContainerWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const scrollContainerRef = (node: HTMLDivElement | null) => {
    // Wire up the virtualizer's scroll element ref
    (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

    // Clean up old observer
    observerRef.current?.disconnect();

    if (node) {
      setContainerWidth(node.clientWidth);
      observerRef.current = new ResizeObserver(([entry]) => {
        setContainerWidth(entry.contentRect.width);
      });
      observerRef.current.observe(node);
    }
  };

  // How many cards fit in one row? At least 1.
  const gridColumns = Math.max(
    1,
    Math.floor((containerWidth + GRID_CARD_GAP) / (GRID_CARD_MIN_WIDTH + GRID_CARD_GAP))
  );

  // Total virtual rows for grid = ceil(products / columns)
  const gridRowCount = Math.ceil(searchResults.length / gridColumns);

  /**
   * Sync virtualizer options when view mode, column count, or data changes.
   * - List mode: 1 product per virtual row, ~104px height
   * - Grid mode: `gridColumns` products per virtual row, ~320px height
   */
  useEffect(() => {
    const isGrid = viewMode === "grid";
    rowVirtualizer.setOptions({
      ...rowVirtualizer.options,
      estimateSize: () => (isGrid ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT),
      count: isGrid
        ? hasNextPage
          ? gridRowCount + 1
          : gridRowCount
        : hasNextPage
          ? searchResults.length + 1
          : searchResults.length
    });
    rowVirtualizer.measure();
  }, [viewMode, gridColumns, searchResults.length, hasNextPage, gridRowCount, rowVirtualizer]);

  return (
    <Card className="border-border bg-background border py-2 shadow-sm">
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
            <div ref={scrollContainerRef} className="relative h-155 overflow-auto scroll-smooth">
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
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative"
                  }}
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
                          <ProductListItem product={product} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /**
                 * ── GRID VIEW VIRTUALIZER ──
                 *
                 * Same 3-div virtualizer structure as list, but each virtual row
                 * contains `gridColumns` products laid out in a CSS grid.
                 *
                 * The virtualizer row index maps to a "grid row":
                 *   - Row 0 → products[0..gridColumns-1]
                 *   - Row 1 → products[gridColumns..2*gridColumns-1]
                 *   - etc.
                 *
                 * The column count is calculated from the container width via
                 * ResizeObserver so the grid stays responsive.
                 */
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative"
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualItems[0]?.start ?? 0}px)`
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const startIndex = virtualRow.index * gridColumns;
                      const rowProducts = searchResults.slice(startIndex, startIndex + gridColumns);

                      if (rowProducts.length === 0) return null;

                      return (
                        <div
                          key={virtualRow.key}
                          ref={rowVirtualizer.measureElement}
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
                <div className="text-muted-foreground flex flex-col items-center py-10 text-center">
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
