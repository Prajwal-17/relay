import { ProductDialog } from "@/features/productDialog/ProductDialog";
import ProductHeader from "@/features/products/ProductHeader";
import ProductResults from "@/features/products/ProductResults";
import { useProductsStore } from "@/store/productsStore";

export default function ProductsPage() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);

  return (
    <div className="bg-background min-h-full space-y-4 px-4 py-4">
      <ProductHeader />
      <ProductResults />
      {openProductDialog && <ProductDialog />}
    </div>
  );
}
