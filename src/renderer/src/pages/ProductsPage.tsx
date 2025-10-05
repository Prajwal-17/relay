import { ProductDialog } from "@/features/productDialog/Product-dialog";
import ProductHeader from "@/features/products/ProductHeader";
import ProductResults from "@/features/products/ProductResults";
import ProductSearch from "@/features/products/ProductSearch";
import { useProductsStore } from "@/store/productsStore";

export default function ProductsPage() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);

  return (
    <div className="bg-muted/70 h-full flex-1 space-y-6 px-6 py-6">
      <ProductHeader />
      <ProductSearch />
      <ProductResults />
      {openProductDialog && <ProductDialog />}
    </div>
  );
}
