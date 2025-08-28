import BillingHeader from "@/features/billing/BillingHeader";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { ProductDialog } from "@/features/productDialog/Product-dialog";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import { useProductsStore } from "@/store/productsStore";
import { useLocation } from "react-router-dom";

const NewEstimate = () => {
  const location = useLocation();
  const estimateId = location.pathname.split("/")[3];
  const openProductDialog = useProductsStore((state) => state.openProductDialog);

  useLoadTransactionDetails("estimate", estimateId);

  return (
    <div className="min-h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-1 flex-col overflow-y-auto">
          <BillingHeader />
          <LineItemsTable />
        </div>
        <BillPreview />
        {openProductDialog && <ProductDialog />}
      </div>
    </div>
  );
};

export default NewEstimate;
