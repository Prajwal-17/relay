import { Receipt } from "lucide-react";
import { TRANSACTION_TYPE } from "@shared/types";
import { CustomerTxnTable } from "./CustomerTxnTable";

export function SalesTab({ customerId }: { customerId: string }) {
  return (
    <CustomerTxnTable
      customerId={customerId}
      type={TRANSACTION_TYPE.SALE}
      numberLabel="Invoice #"
      addLabel="Add Sale"
      emptyIcon={Receipt}
    />
  );
}
