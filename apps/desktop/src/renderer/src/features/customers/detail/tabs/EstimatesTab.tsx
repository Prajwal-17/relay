import { TRANSACTION_TYPE } from "@shared/types";
import { FileText } from "lucide-react";
import { CustomerTxnTable } from "./CustomerTxnTable";

export function EstimatesTab({
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
      type={TRANSACTION_TYPE.ESTIMATE}
      numberLabel="Estimate #"
      addLabel="Add Estimate"
      emptyIcon={FileText}
    />
  );
}
