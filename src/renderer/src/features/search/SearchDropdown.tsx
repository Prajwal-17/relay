import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ignoredWeight } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { convertToRupees } from "@shared/utils/utils";
import { Edit, Package, PackagePlus, Search } from "lucide-react";

const SearchDropdown = ({ rowId }: { rowId: string }) => {
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
  const addLineItem = useLineItemsStore((state) => state.addLineItem);
  const addEmptyLineItem = useLineItemsStore((state) => state.addEmptyLineItem);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setProductId = useProductsStore((state) => state.setProductId);

  const { dropdownRef, searchResults, parentRef, rowVirtualizer, hasNextPage, virtualItems } =
    useProductSearch(PRODUCTSEARCH_TYPE.BILLINGPAGE);

  const openNewProductDialog = () => {
    setIsDropdownOpen();
    setProductId(null);
    setFormDataState({});
    setDialogMode("edit");
    setActionType("add");
    setOpenProductDialog();
  };

  return (
    <>
      <div ref={dropdownRef}>
        <div
          ref={parentRef}
          className="bg-background border-border/80 absolute top-[calc(100%+0.5rem)] left-[10.7%] z-30 max-h-96 w-[60%] overflow-y-auto rounded-2xl border py-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        >
          {searchResults.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center px-8 py-14 text-center">
              <div className="bg-muted/50 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
                <Search className="h-8 w-8 opacity-60" />
              </div>
              <h3 className="text-foreground mb-2 text-xl font-semibold">No products found</h3>
              <p className="mb-6 max-w-sm text-sm font-medium">
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
                          className="group hover:bg-accent/60 flex items-center gap-4 rounded-xl border-l-4 border-transparent px-4 py-3 transition-all duration-200 hover:cursor-pointer"
                          onClick={() => {
                            addLineItem(rowId, product);
                            setIsDropdownOpen();
                            addEmptyLineItem();
                            processSyncQueue();
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="border-border/70 flex h-9 w-9 items-center justify-center rounded-xl border bg-linear-to-br from-blue-50 to-blue-100">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <h4 className="text-foreground truncate text-lg font-semibold">
                                    {product.name}
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchDropdown;
