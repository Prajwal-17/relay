import { Receipt } from "lucide-react";
import { mockSales } from "../../_mock/data";
import { TransactionTable } from "./TransactionTable";

export function SalesTab() {
  const items = mockSales.map((s) => ({
    id: s.id,
    number: s.invoiceNo,
    date: s.date,
    status: s.status,
    amount: s.amount
  }));

  return (
    <TransactionTable
      items={items}
      numberLabel="Invoice #"
      newLabel="New Invoice"
      emptyIcon={Receipt}
      emptyTitle="No sales yet"
      emptyDescription="Invoices raised for this customer will appear here."
    />
  );
}
