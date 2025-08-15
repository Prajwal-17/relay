import { useLocation } from "react-router-dom";
import BillingHeader from "../../components/features/billing/BillingHeader";
import BillPreview from "../../components/features/billing/BillPreview";
import LineItemsTable from "../../components/features/billing/LineItemsTable";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";

const EstimatePage = () => {
  const location = useLocation();
  const saleId = location.pathname.split("/")[3];

  useLoadTransactionDetails("estimate", saleId);

  return (
    <div className="min-h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-1 flex-col overflow-y-auto">
          <BillingHeader />
          <LineItemsTable />
        </div>
        <BillPreview />
      </div>
    </div>
  );
};

export default EstimatePage;
