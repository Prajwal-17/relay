import BillingHeader from "@/features/billing/BillingHeader";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { SummaryFooter } from "@/features/billing/SummaryFooter";
import { ProductDialog } from "@/features/productDialog/Product-dialog";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import useTransactionState from "@/hooks/useTransactionState";
import { useProductsStore } from "@/store/productsStore";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NewEstimate = () => {
  const location = useLocation();
  const estimateId = location.pathname.split("/")[3];
  const openProductDialog = useProductsStore((state) => state.openProductDialog);

  const { clearTransactionState } = useTransactionState();
  useLoadTransactionDetails("estimate", estimateId);

  useEffect(() => {
    /**
     * this effect only runs when the component unmounts or pathname changes
     * does not run when changed route(eg. "/home","/products"), coz react fully unmounts NewSale Component
     */
    return () => {
      clearTransactionState();
    };
  }, [location.pathname]);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="relative flex h-full flex-1 flex-col">
        <div className="overflow-y-auto">
          <BillingHeader />
          <LineItemsTable />
        </div>
        <SummaryFooter />
      </div>
      <BillPreview />
      {openProductDialog && <ProductDialog />}
    </div>
  );
};

export default NewEstimate;
