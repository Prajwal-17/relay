import BillPreview from "@/components/features/billing/BillPreview";
import { ProductDialog } from "@/components/productsPage/Product-dialog";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import { useProductsStore } from "@/store/productsStore";
import { useLocation } from "react-router-dom";
import BillingHeader from "../../components/features/billing/BillingHeader";
import LineItemsTable from "../../components/features/billing/LineItemsTable";

const SalesPage = () => {
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

export default SalesPage;
