import { FileText } from "lucide-react";
import { mockEstimates } from "../../_mock/data";
import { TransactionTable } from "./TransactionTable";

export function EstimatesTab() {
  const items = mockEstimates.map((e) => ({
    id: e.id,
    number: e.estimateNo,
    date: e.date,
    status: e.status,
    amount: e.amount
  }));

  return (
    <TransactionTable
      items={items}
      numberLabel="Estimate #"
      newLabel="New Estimate"
      emptyIcon={FileText}
      emptyTitle="No estimates yet"
      emptyDescription="Quotations raised for this customer will appear here."
    />
  );
}
