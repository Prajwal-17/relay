import { TransactionDetailsDialog } from "@/features/transactions/TransactionDetailsDialog";
import { ProductDialog } from "@/features/products/dialog/ProductDialog";
import ProductHeader from "@/features/products/ProductHeader";
import ProductResults from "@/features/products/ProductResults";
import { useProductsStore } from "@/features/products/products.store";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";

export default function ProductsPage() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);
  const transactionType = useViewModalStore((state) => state.transactionType);

  return (
    <div className="bg-background flex h-full flex-col gap-2 p-3">
      <ProductHeader />
      <ProductResults />
      {openProductDialog && <ProductDialog />}
      {isViewModalOpen && transactionId && (
        <TransactionDetailsDialog type={transactionType} id={transactionId} />
      )}
    </div>
  );
}
