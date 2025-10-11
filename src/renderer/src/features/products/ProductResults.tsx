import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ignoredWeight } from "@/constants";
import { useProductSearchV2 } from "@/hooks/products/useProductSearchV2";
import { useProductsStore } from "@/store/productsStore";
import { Edit, LoaderCircle, Package, Search } from "lucide-react";

export default function ProductResults() {
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);

  const { searchResults, parentRef, rowVirtualizer, status } = useProductSearchV2();

  return (
    <Card className="border-border bg-background border py-2 shadow-sm">
      {status === "pending" ? (
        <div className="my-8 flex justify-center gap-3">
          <div className="text-muted-foreground text-xl font-semibold">Loading</div>
          <LoaderCircle className="animate-spin text-blue-500" size={26} />
        </div>
      ) : (
        <>
          {searchResults.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Search className="mx-auto mb-6 h-16 w-16 opacity-30" />
              <h3 className="mb-3 text-xl font-semibold text-slate-700">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search</p>
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
            <div ref={parentRef} className="relative h-[620px] overflow-auto scroll-smooth pb-0">
              <div
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const product = searchResults[virtualRow.index];
                  if (!product) return null;
                  return (
                    <div
                      key={virtualRow.key}
                      className="absolute top-0 left-0 w-full"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                        height: `${virtualRow.size}px`
                      }}
                      data-index={virtualRow.index}
                    >
                      <div className="group hover:bg-accent/70 flex items-center justify-between gap-4 p-6 transition-colors">
                        <div className="border-border flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex flex-1 items-center gap-6">
                          <div className="flex-1">
                            <div className="flex gap-2">
                              <h3 className="text-xl font-semibold">{product.name}</h3>
                              {product.weight !== null &&
                                ignoredWeight.some((w) =>
                                  `${product.weight}+${product.unit}`.includes(w)
                                ) && (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-orange-200 bg-orange-50 px-2.5 py-0.5 text-base font-semibold text-orange-700 shadow-sm"
                                  >
                                    {product.weight}
                                    {product.unit}
                                  </Badge>
                                )}
                              {product.mrp && (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5 text-base font-medium text-slate-600"
                                >
                                  MRP ₹{product.mrp}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="mt-1 text-base font-medium text-slate-500">
                                {product.totalQuantitySold ?? "null"} sold
                              </p>
                              {product.purchasePrice && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <p className="mt-1 text-base font-semibold text-slate-800">
                                    Purchase Price ₹ {product.purchasePrice}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">₹ {product.price}</span>
                            </div>
                          </div>
                          <Badge
                            variant={product.isDisabled ? "secondary" : "default"}
                            className={
                              product.isDisabled
                                ? "bg-slate-100 text-slate-600"
                                : "bg-green-100 text-green-700"
                            }
                          >
                            {product.isDisabled ? "Inactive" : "Active"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActionType("edit");
                              setOpenProductDialog();
                              setFormDataState({
                                ...product,
                                mrp: product.mrp,
                                price: product.price.toString()
                              });
                            }}
                            className="text-muted-foreground hover:text-foreground h-9 px-3 opacity-0 transition-opacity group-hover:opacity-100 hover:cursor-pointer hover:bg-slate-100"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
