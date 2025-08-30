import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useCustomerStore } from "@/store/customersStore";
import { formatDateStr, formatToRupees } from "@shared/utils";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { getCustomerTypeColor } from "./CustomerTypeColor";

type TransactionType = {
  id: string;
  type: "invoice" | "estimate";
  number: string;
  totalQuantity: number;
  grandTotal: number;
  status: "paid";
  createdAt: string;
};

export const CustomerTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);

  useEffect(() => {
    if (!selectedCustomer?.id) return;

    async function getAllTransactionsById(customerId: string) {
      try {
        const response = await window.customersApi.getAllTransactionsById(customerId);
        if (response.status === "success") {
          setTransactions(
            response.data.map((t) => ({
              id: t.id,
              type: t.invoiceNo ? "invoice" : "estimate",
              number: t.invoiceNo ? t.invoiceNo : t.estimateNo,
              totalQuantity: t.totalQuantity,
              grandTotal: formatToRupees(t.grandTotal),
              status: "paid",
              createdAt: formatDateStr(t.createdAt)
            }))
          );
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.log(error);
      }
    }

    getAllTransactionsById(selectedCustomer.id);
  }, [selectedCustomer]);

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-base font-semibold">Type</TableHead>
                    <TableHead className="text-base font-semibold">Number</TableHead>
                    <TableHead className="text-base font-semibold">Date</TableHead>
                    <TableHead className="text-right text-base font-semibold">Total</TableHead>
                    <TableHead className="text-base font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="h-14">
                      <TableCell className="py-4">
                        <Badge variant="outline" className="px-3 py-1 text-sm capitalize">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-base font-medium">
                        {transaction.type === "invoice"
                          ? `INV-${transaction.number}`
                          : `EST-${transaction.number}`}
                      </TableCell>
                      <TableCell className="py-4 text-base">{transaction.createdAt}</TableCell>
                      <TableCell className="py-4 text-right text-base font-medium">
                        ₹ {transaction.grandTotal}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`px-3 py-1 text-sm ${getCustomerTypeColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-muted-foreground py-12 text-center">
              <ShoppingCart className="mx-auto mb-6 h-16 w-16 opacity-50" />
              <p className="text-lg">No transactions found for this customer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
