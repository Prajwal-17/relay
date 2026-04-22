import { ProductDialog } from "@/features/productDialog/ProductDialog";
import ProductHeader from "@/features/products/ProductHeader";
import ProductResults from "@/features/products/ProductResults";
import { useProductsStore } from "@/store/productsStore";

export default function ProductsPage() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);

  return (
    <div className="bg-background flex h-full flex-col gap-4 px-4 pt-4 pb-2">
      <ProductHeader />
      <ProductResults />
      {openProductDialog && <ProductDialog />}
    </div>
  );
}
