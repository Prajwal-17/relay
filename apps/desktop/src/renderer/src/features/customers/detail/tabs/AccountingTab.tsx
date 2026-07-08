import { Button } from "@/components/ui/button";
import { MetricTile } from "../shared/MetricTile";
import { SectionCard } from "../shared/SectionCard";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { Download, Wallet } from "lucide-react";
import type { CustomerMock } from "../../_mock/types";
import { mockLedger } from "../../_mock/ledger";
import { mockPayments } from "../../_mock/payments";
import { LedgerTable } from "./LedgerTable";

export function AccountingTab({
  customer,
  onRecordPayment
}: {
  customer: CustomerMock;
  onRecordPayment: () => void;
}) {
  const opening = mockLedger.find((e) => e.type === "opening");
  const lastPayment = mockPayments[0];
  const currentBalance = mockLedger.at(-1)?.runningBalance ?? customer.outstanding;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricTile
            label="Current Balance"
            value={formatRupee(currentBalance)}
            subValue={currentBalance >= 0 ? "Debit (receivable)" : "Credit (payable)"}
            tone={currentBalance >= 0 ? "destructive" : "success"}
            icon={<Wallet className="size-3.5" />}
          />
          <MetricTile
            label="Carry Forward"
            value={opening ? formatRupee(opening.debit) : "—"}
            subValue="Opening balance"
          />
          <MetricTile
            label="Last Payment"
            value={lastPayment ? formatRupee(lastPayment.amount) : "—"}
            subValue={
              lastPayment
                ? `${lastPayment.mode.toUpperCase()} · ${formatDateStr(lastPayment.date)}`
                : undefined
            }
            tone="success"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-9 cursor-pointer">
          <Download className="size-4" />
          Export Ledger
        </Button>
        <Button variant="outline" className="h-9 cursor-pointer">
          Adjust Balance
        </Button>
      </div>

      {/* Ledger */}
      <SectionCard
        title="Ledger"
        description="Account statement with running balance"
        bodyClassName="p-0"
      >
        <LedgerTable entries={mockLedger} />
      </SectionCard>

      {/* Spacer + record payment CTA at bottom */}
      <div className="flex justify-end">
        <Button className="hover:bg-primary-hover h-9 cursor-pointer" onClick={onRecordPayment}>
          Record Payment
        </Button>
      </div>
    </div>
  );
}
