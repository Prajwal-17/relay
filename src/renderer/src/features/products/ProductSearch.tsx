import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useProductsStore } from "@/store/productsStore";
import { PRODUCT_FILTER, type ProductFilterType } from "@shared/types";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ProductSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const filterType = useProductsStore((state) => state.filterType);
  const setFilterType = useProductsStore((state) => state.setFilterType);
  const { productsSearchParam, setProductsSearchParam } = useProductSearch(
    PRODUCTSEARCH_TYPE.PRODUCTPAGE
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <div className="sticky top-0 z-10 transition-all duration-300 ease-in-out">
        <div>
          <div className="border-border bg-background flex flex-col items-start justify-between gap-6 rounded-xl border p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="relative max-w-2xl flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform" />
              <Input
                ref={inputRef}
                placeholder="Search products by name"
                value={productsSearchParam}
                onChange={(e) => setProductsSearchParam(e.target.value)}
                className="bg-muted/30 h-16 rounded-lg pl-12 text-xl! font-medium shadow-sm"
              />
              {productsSearchParam && (
                <X
                  onClick={() => {
                    setProductsSearchParam("");
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className="hover:bg-accent absolute top-1/2 right-4 -translate-y-1/2 transform cursor-pointer rounded-sm"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <Tabs
                value={filterType}
                onValueChange={(value) => setFilterType(value as ProductFilterType)}
                className="w-full"
              >
                <TabsList className="bg-accent text-background grid h-auto w-full grid-cols-4 items-center rounded-lg p-1">
                  <TabsTrigger
                    value={PRODUCT_FILTER.ACTIVE}
                    className="data-[state=active]:text-foreground data-[state=active]:bg-background cursor-pointer text-base font-semibold data-[state=active]:shadow-sm"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value={PRODUCT_FILTER.INACTIVE}
                    className="data-[state=active]:text-foreground data-[state=active]:bg-background cursor-pointer text-base font-semibold data-[state=active]:shadow-sm"
                  >
                    Inactive
                  </TabsTrigger>
                  <TabsTrigger
                    value={PRODUCT_FILTER.ALL}
                    className="data-[state=active]:text-foreground data-[state=active]:bg-background cursor-pointer text-base font-semibold data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value={PRODUCT_FILTER.DELETED}
                    className="data-[state=active]:text-foreground data-[state=active]:bg-background cursor-pointer text-base font-semibold data-[state=active]:shadow-sm"
                  >
                    Deleted
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
