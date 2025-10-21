import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductSearchV2 } from "@/hooks/products/useProductSearchV2";
import { useProductsStore } from "@/store/productsStore";
import { PRODUCT_FILTER, type ProductFilterType } from "@shared/types";
import { Search } from "lucide-react";

export default function ProductSearch() {
  const filterType = useProductsStore((state) => state.filterType);
  const setFilterType = useProductsStore((state) => state.setFilterType);
  const { searchParam, setSearchParam } = useProductSearchV2();

  return (
    <>
      <div className="sticky top-0 z-10 transition-all duration-300 ease-in-out">
        <div>
          <div className="border-border bg-background flex flex-col items-start justify-between gap-6 rounded-xl border p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="relative max-w-2xl flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
              <Input
                placeholder="Search products by name"
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value)}
                className="bg-muted/30 border-border h-16 rounded-lg pl-12 !text-xl font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-4">
              <Tabs
                value={filterType}
                onValueChange={(value) => setFilterType(value as ProductFilterType)}
              >
                <TabsList className="grid w-full grid-cols-3 rounded-lg bg-slate-100 p-1">
                  <TabsTrigger
                    value={PRODUCT_FILTER.ALL}
                    className="cursor-pointer data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value={PRODUCT_FILTER.ACTIVE}
                    className="cursor-pointer data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value={PRODUCT_FILTER.INACTIVE}
                    className="cursor-pointer data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Inactive
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
