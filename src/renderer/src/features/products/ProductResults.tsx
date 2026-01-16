import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ignoredWeight } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useProductsStore } from "@/store/productsStore";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatToRupees, IndianRupees } from "@shared/utils/utils";
import { Edit, LoaderCircle, Package, Search } from "lucide-react";

export default function ProductResults() {
  const setProductId = useProductsStore((state) => state.setProductId);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);

  const { searchResults, parentRef, rowVirtualizer, status, virtualItems, hasNextPage } =
    useProductSearch(PRODUCTSEARCH_TYPE.PRODUCTPAGE);

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
            /**
             * Virtualizer works using 3 divs
             *  - Top div with fixed height overflow Provides scrolling viewport
             *  - 2nd div with height-`rowVirtualizer.getTotalSize()`px
             *      creates full scrollable div without rendering all rows
             *  - 3rd div is for rendering virtual items -> this should be absolute and have transformY with value
             *      virtualItem.start for vertical virtualization
             *      each visible items is placed from the virtualItems.start
             */
            <div ref={parentRef} className="relative h-[620px] overflow-auto scroll-smooth">
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
                        <div className="group hover:bg-accent/70 flex items-center justify-between gap-4 px-6 py-3 transition-colors">
                          <div className="border-border flex h-10 w-10 items-center justify-center rounded-lg border bg-linear-to-br from-blue-50 to-blue-100">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex flex-1 items-center gap-6">
                            <div className="flex-1">
                              <div className="flex gap-2">
                                <h3
                                  className={`text-xl font-semibold ${product.isDeleted ? "text-muted-foreground line-through decoration-1" : ""}`}
                                >
                                  {product.name}
                                </h3>
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
                                    MRP ₹{formatToRupees(product.mrp)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-muted-foreground mt-1 text-base font-medium">
                                  {product.totalQuantitySold?.toFixed(2) ?? "null"} sold
                                </p>
                                {product.purchasePrice && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <p className="text-foreground mt-1 text-base font-semibold">
                                      Purchase Price ₹{formatToRupees(product.purchasePrice)}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                  {IndianRupees.format(formatToRupees(product.price))}
                                </span>
                              </div>
                            </div>
                            {product.isDeleted ? (
                              <div className="text-destructive bg-accent/80 rounded-lg px-2.5 py-1 text-sm font-semibold">
                                Deleted on • {formatDateStr(product.deletedAt || undefined)}
                              </div>
                            ) : (
                              <Badge
                                variant={product.isDisabled ? "secondary" : "default"}
                                className={
                                  product.isDisabled
                                    ? "text-secondary-foreground bg-secondary"
                                    : "bg-success/20 text-success"
                                }
                              >
                                {product.isDisabled ? "Inactive" : "Active"}
                              </Badge>
                            )}
                          </div>
                          {!product.isDeleted && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setActionType("edit");
                                  setProductId(product.id);
                                  setFormDataState({
                                    name: product.name,
                                    weight: product.weight,
                                    unit: product.unit,
                                    mrp: product.mrp
                                      ? formatToRupees(product.mrp).toString()
                                      : null,
                                    price: formatToRupees(product.price).toString(),
                                    purchasePrice: product.purchasePrice
                                      ? formatToRupees(product.purchasePrice).toString()
                                      : null,
                                    isDisabled: product.isDisabled,
                                    isDeleted: product.isDeleted
                                  });
                                  setOpenProductDialog();
                                }}
                                className="text-muted-foreground bg-secondary/80 hover:text-foreground hover:bg-secondary h-9 cursor-pointer px-3 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </div>
                          )}
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
          )}
        </>
      )}
    </Card>
  );
}
