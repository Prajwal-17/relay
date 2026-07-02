import { useProductsStore } from "@/store/productsStore";
import { ProductDialog } from "../productDialog/ProductDialog";

export const ProductDialogWrapper = () => {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  return openProductDialog ? <ProductDialog /> : null;
};
