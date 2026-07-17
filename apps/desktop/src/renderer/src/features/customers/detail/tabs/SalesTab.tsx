import { Receipt } from "lucide-react";
import { TRANSACTION_TYPE } from "@shared/types";
import { CustomerTxnTable } from "./CustomerTxnTable";

export function SalesTab({
  customerId,
  customerName
}: {
  customerId: string;
  customerName: string;
}) {
  return (
    <CustomerTxnTable
      customerId={customerId}
      customerName={customerName}
      type={TRANSACTION_TYPE.SALE}
      numberLabel="Invoice #"
      addLabel="Add Sale"
      emptyIcon={Receipt}
    />
  );
}
