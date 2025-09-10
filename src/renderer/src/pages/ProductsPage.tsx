import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCTS_LIMIT } from "@/constants";
import { ignoredWeight } from "@/constants/IgnoredWeights";
import { ProductDialog } from "@/features/productDialog/Product-dialog";
import useDebounce from "@/hooks/useDebounce";
import { useProductsStore } from "@/store/productsStore";
import type { ProductsType } from "@shared/types";
import { Edit, Package, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type FilterType = "all" | "active" | "inactive";

export default function ProductsPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchParam = useProductsStore((state) => state.searchParam);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const searchResult = useProductsStore((state) => state.searchResult);
  const setSearchResult = useProductsStore((state) => state.setSearchResult);
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormData = useProductsStore((state) => state.setFormData);

  const debouncedSearchParam = useDebounce(searchParam, 300);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (term: string, fetchPage: number, mode: "replace" | "append", limit: number) => {
      setLoading(true);
      try {
        if (mode === "replace") {
          setSearchResult("replace", []);
        }
        const response = await window.productsApi.search(term, fetchPage, limit);
        if (response.status === "success") {
          setSearchResult(mode, response.data);
          setPage(fetchPage + 1);
          if (response.data.length < limit) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.log(error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [setSearchResult]
  );

  useEffect(() => {
    if (debouncedSearchParam) {
      setHasMore(true);
      setPage(1);
      fetchProducts(debouncedSearchParam, 1, "replace", PRODUCTS_LIMIT);
    } else {
      setSearchResult("replace", []);
      setHasMore(true);
      setPage(1);
    }
  }, [debouncedSearchParam, fetchProducts, setSearchResult]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || loading || !hasMore) return;

    const scrollPercent =
      (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;

    if (scrollPercent >= 80) {
      fetchProducts(searchParam, page, "append", PRODUCTS_LIMIT);
    }
  }, [loading, hasMore, searchParam, page, fetchProducts]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll, searchParam]);

  return (
    <div ref={scrollRef} className="bg-muted/70 h-full flex-1 space-y-8 overflow-y-auto p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Products</h1>
          <p className="text-muted-foreground text-lg">Manage product inventory and pricing</p>
        </div>
        <Button
          onClick={() => {
            setActionType("add");
            setOpenProductDialog();
          }}
          size="lg"
          className="bg-primary hover:bg-primary/90 h-12 gap-2 px-6 py-3 text-base font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Button>
      </div>

      <div className="sticky top-0 z-10 transition-all duration-300 ease-in-out">
        <div>
          <div className="border-border flex flex-col items-start justify-between gap-6 rounded-xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center">
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
                onValueChange={(value) => setFilterType(value as FilterType)}
              >
                <TabsList className="grid w-full grid-cols-3 rounded-lg bg-slate-100 p-1">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value="inactive"
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Inactive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {searchResult.length === 0 ? (
          <Card className="border-border border bg-white p-16 text-center shadow-sm">
            <div className="text-slate-500">
              <Search className="mx-auto mb-6 h-16 w-16 opacity-30" />
              <h3 className="mb-3 text-xl font-semibold text-slate-700">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search</p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="border-border border bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {searchResult.map((product: ProductsType, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between gap-4 p-6 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100">
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
                          setFormData({
                            ...product,
                            mrp: product.mrp,
                            price: product.price
                          });
                        }}
                        className="text-muted-foreground hover:text-foreground h-9 px-3 opacity-0 transition-opacity group-hover:opacity-100 hover:cursor-pointer hover:bg-slate-100"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>

      {openProductDialog && <ProductDialog />}
    </div>
  );
}
