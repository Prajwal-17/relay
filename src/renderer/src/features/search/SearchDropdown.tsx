import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ignoredWeight } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { formatToRupees } from "@shared/utils/utils";
import { Edit, Package, Search } from "lucide-react";

const SearchDropdown = ({ rowId }: { rowId: string }) => {
  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);
  const addLineItem = useLineItemsStore((state) => state.addLineItem);
  const addEmptyLineItem = useLineItemsStore((state) => state.addEmptyLineItem);
  const activeRowId = useSearchDropdownStore((state) => state.activeRowId);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setProductId = useProductsStore((state) => state.setProductId);

  const { dropdownRef, searchResults, parentRef, rowVirtualizer, hasNextPage, virtualItems } =
    useProductSearch(PRODUCTSEARCH_TYPE.BILLINGPAGE);

  return (
    <>
      <div ref={dropdownRef}>
        {isDropdownOpen && activeRowId === rowId && (
          <div
            ref={parentRef}
            className="bg-background border-border absolute top-full left-[10%] z-30 max-h-96 w-[60%] overflow-y-auto rounded-lg border py-1 shadow-xl"
          >
            {searchResults.length === 0 ? (
              <div className="text-muted-foreground p-16 text-center">
                <Search className="mx-auto mb-6 h-16 w-16 opacity-30" />
                <h3 className="text-foreground mb-3 text-xl font-semibold">No products found</h3>
                <p className="text-muted-foreground font-medium">Try adjusting your search</p>
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
                        <>
                          <div
                            key={virtualRow.key}
                            ref={rowVirtualizer.measureElement}
                            data-index={virtualRow.index}
                          >
                            <div
                              className="group hover:border-primary hover:bg-accent flex items-center gap-4 border-l-4 border-transparent px-4 py-3 transition-all duration-200 hover:cursor-pointer"
                              onClick={() => {
                                addLineItem(rowId, product);
                                setIsDropdownOpen();
                                addEmptyLineItem();
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <div className="border-border flex h-8 w-8 items-center justify-center rounded-lg border bg-linear-to-br from-blue-50 to-blue-100">
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
                                          MRP ₹{formatToRupees(product.mrp)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <span className="text-success text-xl font-bold">
                                      ₹ {formatToRupees(product.price)}
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
                                    ...product,
                                    mrp: product.mrp,
                                    price: product.price.toString()
                                  });
                                }}
                                className="hover:cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </>
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
        )}
      </div>
    </>
  );
};

export default SearchDropdown;
