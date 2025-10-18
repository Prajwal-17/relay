import BillingHeader from "@/features/billing/BillingHeader";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { ProductDialogWrapper } from "@/features/billing/ProductDailogWrapper";
import { SummaryFooter } from "@/features/billing/SummaryFooter";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import type { TransactionType } from "@shared/types";
import { useParams } from "react-router-dom";

const BillingPage = () => {
  const { type, id } = useParams();

  useLoadTransactionDetails(type as TransactionType, id);

  return (
    <>
      <div className="bg-background-secondary flex h-full gap-2 overflow-hidden">
        <div className="bg-background relative flex h-full flex-1 flex-col">
          <div className="overflow-y-auto">
            <BillingHeader />
            <LineItemsTable />
          </div>
          <SummaryFooter />
        </div>
        <BillPreview />
        <ProductDialogWrapper />
      </div>
    </>
  );
};

export default BillingPage;
