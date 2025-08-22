import BillPreview from "@/components/features/billing/BillPreview";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import { useLocation } from "react-router-dom";
import BillingHeader from "../../components/features/billing/BillingHeader";
import LineItemsTable from "../../components/features/billing/LineItemsTable";

const SalesPage = () => {
  const location = useLocation();
  const saleId = location.pathname.split("/")[3];

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
    </div>
  );
};

export default SalesPage;
