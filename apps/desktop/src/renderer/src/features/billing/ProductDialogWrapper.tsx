import { useProductsStore } from "@/features/products/products.store";
import { ProductDialog } from "@/features/products/dialog/ProductDialog";

export const ProductDialogWrapper = () => {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  return openProductDialog ? <ProductDialog /> : null;
};
