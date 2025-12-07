import BillingHeader from "@/features/billing/BillingHeader";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { ProductDialogWrapper } from "@/features/billing/ProductDailogWrapper";
import { SummaryFooter } from "@/features/billing/SummaryFooter";
import useLoadTransactionDetails from "@/hooks/useLoadTransactionDetails";
import type { TransactionType } from "@shared/types";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const BillingPage = () => {
  const { type, id } = useParams();
  const formattedType = type?.slice(0, -1);
  // const billingStateReset = useBillingStore((state) => state.reset);

  useEffect(() => {
    return () => {
      // billingStateReset();
      localStorage.setItem("bill-preview-date", new Date().toISOString());
    };
    // eslint-disable-next-line
  }, [type, id]);

  useLoadTransactionDetails(formattedType as TransactionType, id);

  return (
    <>
      <div className="flex h-full gap-2 overflow-hidden">
        <div className="bg-background-secondary relative flex h-full flex-1 flex-col">
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
