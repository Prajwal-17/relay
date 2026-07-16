import { Card } from "@/components/ui/card";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import type { ProductSearchItemDTO } from "@shared/types";
import { LoaderCircle, Search } from "lucide-react";
import { useEffect } from "react";
import ProductListItem from "./ProductListItem";

export default function ProductResults() {
  const {
    searchResults,
    parentRef,
    rowVirtualizer,
    virtualItems,
    status,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useProductSearch(PRODUCTSEARCH_TYPE.PRODUCTPAGE);

  const totalVirtualRows = hasNextPage ? searchResults.length + 1 : searchResults.length;

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
            <div ref={parentRef} className="relative flex-1 overflow-auto scroll-smooth">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative"
                }}
              >
                <div
                  className="absolute left-0 top-0 w-full"
                  style={{
                    transform: `translateY(${virtualItems[0]?.start ?? 0}px)`
                  }}
                >
                  {virtualItems.map((virtualRow) => {
                    const product = searchResults[virtualRow.index];
                    if (!product) return null;
                    return (
                      <div
                        key={virtualRow.key}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                      >
                        <ProductListItem product={product as ProductSearchItemDTO} />
                      </div>
                    );
                  })}
                </div>
              </div>
              {!hasNextPage && searchResults.length > 0 && (
                <div className="text-muted-foreground flex flex-col items-center py-4 text-center">
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
