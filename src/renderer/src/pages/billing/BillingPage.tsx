import BillingHeader from "@/features/billing/BillingHeader";
import BillingSkeleton from "@/features/billing/BillingSkeleton";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { ProductDialogWrapper } from "@/features/billing/ProductDailogWrapper";
import { SummaryFooter } from "@/features/billing/SummaryFooter";
import useReset from "@/hooks/transaction/useBillingReset";
import useInitialBillingData from "@/hooks/transaction/useInitialBillingData";
import useLoadTransactionDetails from "@/hooks/transaction/useLoadTransactionDetails";
import { useBillingStore } from "@/store/billingStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const BillingPage = () => {
  const { type, id } = useParams();
  const formattedType = type?.slice(0, -1) as TransactionType;

  // synchronous state reset
  useReset(formattedType, id);

  useInitialBillingData(formattedType, id);

  const setBillingType = useBillingStore((state) => state.setBillingType);

  useEffect(() => {
    if (formattedType && Object.values(TRANSACTION_TYPE).includes(formattedType)) {
      setBillingType(formattedType);
    }
  }, [formattedType, setBillingType]);

  useEffect(() => {
    return () => {
      localStorage.setItem("bill-preview-date", new Date().toISOString());
    };
  }, [type, id]);

  const { isLoading } = useLoadTransactionDetails(formattedType as TransactionType, id);

  if (isLoading) {
    return <BillingSkeleton />;
  }

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
