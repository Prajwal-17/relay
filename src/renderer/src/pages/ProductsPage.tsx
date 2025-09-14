import { ProductDialog } from "@/features/productDialog/Product-dialog";
import {
  default as ProductHeader,
  default as ProductResults
} from "@/features/products/ProductResults";
import ProductSearch from "@/features/products/ProductSearch";
import useProductPage from "@/hooks/useProductPage";

export default function ProductsPage() {
  const { scrollRef, openProductDialog } = useProductPage();

  return (
    <div ref={scrollRef} className="bg-muted/70 h-full flex-1 space-y-8 overflow-y-auto p-8">
      <ProductHeader />
      <ProductSearch />
      <ProductResults />
      {openProductDialog && <ProductDialog />}
    </div>
  );
}
