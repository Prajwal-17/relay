import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDateStr, formatTimeStr } from "@shared/utils";
import { ReceiptIndianRupee } from "lucide-react";
import { useState } from "react";

export const DashboardTable = () => {
  const [rows, setRows] = useState([]);

  return (
    <>
      <Card className="my-0 py-3">
        <CardContent className="px-3">
          {rows.length > 0 ? (
            <div className="max-h-[415px] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-lg font-semibold">Date</TableHead>
                    <TableHead className="text-lg font-semibold">Invoice No</TableHead>
                    <TableHead className="text-lg font-semibold">Name</TableHead>
                    <TableHead className="text-lg font-semibold">Amount</TableHead>
                    <TableHead className="text-lg font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((transaction) => (
                    <TableRow key={transaction.id} className="h-14">
                      <TableCell className="py-4">
                        <Badge variant="outline" className="px-3 py-1 text-lg capitalize">
                          {formatDateStr(transaction.createdAt)}{" "}
                          {formatTimeStr(transaction.createdAt)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {transaction.invoiceNo}
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {transaction.customerName}
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        ₹ {transaction.grandTotal}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="link" className="text-primary px-0 text-lg">
                            Convert
                          </Button>
                          {/* <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreHorizontal className="h-5 w-5" />
                              <span className="sr-only">More actions</span>
                            </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-muted-foreground py-12 text-center">
              <ReceiptIndianRupee className="mx-auto mb-6 h-16 w-16 opacity-50" />
              <p className="text-lg">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
