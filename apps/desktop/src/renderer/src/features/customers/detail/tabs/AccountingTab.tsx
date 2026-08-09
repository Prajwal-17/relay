import { useCustomerActions } from "@/features/customers/customerActions";
import { useCustomerLedgerSummary } from "@/features/customers/hooks/useCustomerLedger";
import { AccountSummaryPanel } from "./AccountSummaryPanel";
import { LedgerTable } from "./LedgerTable";

export function AccountingTab({ customerId }: { customerId: string }) {
  const { openQuickSale, openPayment, openAdjust } = useCustomerActions();
  const summaryQuery = useCustomerLedgerSummary(customerId);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[clamp(280px,24vw,320px)_minmax(0,1fr)] gap-3">
      <AccountSummaryPanel
        summary={summaryQuery.summary}
        isLoading={summaryQuery.status === "pending"}
        isError={summaryQuery.isError}
        isRetrying={summaryQuery.isFetching}
        onRetry={() => void summaryQuery.refetch()}
        onQuickSale={openQuickSale}
        onRecordPayment={openPayment}
        onAdjustBalance={openAdjust}
      />
      <div className="min-h-0 min-w-0">
        <LedgerTable customerId={customerId} />
      </div>
    </div>
  );
}
