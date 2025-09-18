import { PRODUCTS_SEARCH_DELAY, PRODUCTS_SEARCH_PAGE_SIZE } from "@/constants";
import { ProductDialog } from "@/features/productDialog/Product-dialog";
import ProductHeader from "@/features/products/ProductHeader";
import ProductResults from "@/features/products/ProductResults";
import ProductSearch from "@/features/products/ProductSearch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchProducts } from "@/lib/apiAdapters";
import { useProductsStore } from "@/store/productsStore";
import type { ProductsType } from "@shared/types";

export default function ProductsPage() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setSearchResult = useProductsStore((state) => state.setSearchResult);

  // <T> - type of fetch fnc returns
  const { scrollRef, searchParam, setSearchParam, loading } = useInfiniteScroll<ProductsType>({
    fetchFn: fetchProducts,
    stateUpdater: setSearchResult,
    delay: PRODUCTS_SEARCH_DELAY,
    pageSize: PRODUCTS_SEARCH_PAGE_SIZE
  });

  return (
    <div ref={scrollRef} className="bg-muted/70 h-full flex-1 space-y-8 overflow-y-auto p-8">
      <ProductHeader />
      <ProductSearch searchParam={searchParam} setSearchParam={setSearchParam} loading={loading} />
      <ProductResults />
      {openProductDialog && <ProductDialog />}
    </div>
  );
}
