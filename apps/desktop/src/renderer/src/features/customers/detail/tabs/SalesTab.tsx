import { Receipt } from "lucide-react";
import { TRANSACTION_TYPE } from "@shared/types";
import { CustomerTxnTable } from "./CustomerTxnTable";

export function SalesTab({
  customerId,
  customerName,
  customerType
}: {
  customerId: string;
  customerName: string;
  customerType: string;
}) {
  return (
    <CustomerTxnTable
      customerId={customerId}
      customerName={customerName}
      customerType={customerType}
      type={TRANSACTION_TYPE.SALE}
      numberLabel="Invoice #"
      addLabel="Add Sale"
      emptyIcon={Receipt}
    />
  );
}
