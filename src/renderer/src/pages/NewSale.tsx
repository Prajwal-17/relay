import BillingHeader from "@/features/billing/BillingHeader";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { ProductDialog } from "@/features/productDialog/Product-dialog";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import { useProductsStore } from "@/store/productsStore";
import { useLocation } from "react-router-dom";

const NewSale = () => {
  const location = useLocation();
  const saleId = location.pathname.split("/")[3];
  const openProductDialog = useProductsStore((state) => state.openProductDialog);

  useLoadTransactionDetails("sale", saleId);

  return (
    <div className="min-h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-1 flex-col overflow-y-auto">
          <BillingHeader />
          <LineItemsTable />
        </div>
        <BillPreview />
      </div>
      {openProductDialog && <ProductDialog />}
    </div>
  );
};

export default NewSale;
