import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import {
  TRANSACTION_TYPE,
  type ApiResponse,
  type Estimate,
  type Sale,
  type TransactionType
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, ReceiptIndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RecentTransactionsTableRow from "./RecentTransactionsTableRow";

const fetchRecentTransactions = async (type: TransactionType) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/dashboard/recent-transactions/${type}?limit=5`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
export function RecentActivitiesTable() {
  const [type, setType] = useState<TransactionType>(TRANSACTION_TYPE.SALE);
  const { deleteMutation, convertMutation } = useHomeDashboard({ type });

  const { data, status, isError, error } = useQuery({
    queryKey: [type],
    queryFn: () => fetchRecentTransactions(type),
    select: (
      response: ApiResponse<
        (Sale & { customerName: string })[] | (Estimate & { customerName: string })[] | []
      >
    ) => {
      return response.status === "success" ? response.data : null;
    }
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
        <Tabs value={type} onValueChange={(value) => setType(value as TransactionType)}>
          <TabsList>
            <TabsTrigger className="cursor-pointer" value={TRANSACTION_TYPE.SALE}>
              {TRANSACTION_TYPE.SALE.charAt(0).toUpperCase()}
              {TRANSACTION_TYPE.SALE.slice(1)}
            </TabsTrigger>
            <TabsTrigger className="cursor-pointer" value={TRANSACTION_TYPE.ESTIMATE}>
              {TRANSACTION_TYPE.ESTIMATE.charAt(0).toUpperCase()}
              {TRANSACTION_TYPE.ESTIMATE.slice(1)}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="">
        {status === "pending" ? (
          <div className="my-8 flex flex-1 justify-center gap-3">
            <span className="text-muted-foreground text-lg font-semibold">Loading</span>
            <LoaderCircle className="text-primary animate-spin" size={24} />
          </div>
        ) : (
          <div className="border-border/60 rounded-lg border shadow-md">
            <div className="bg-muted text-muted-foreground grid grid-cols-12 gap-4 px-4 py-2 text-base font-semibold">
              <div className="col-span-2 flex items-center">Date</div>
              <div className="col-span-3 flex items-center">Customer Name</div>
              <div className="col-span-2 flex items-center">
                {type === TRANSACTION_TYPE.SALE ? "Invoice No" : "Estimate No"}
              </div>
              <div className="col-span-2 flex items-center">Amount</div>
              <div className="col-span-2 flex items-center">Status</div>
              <div className="col-span-1 flex items-center">Actions</div>
            </div>

            {data && data.length > 0 ? (
              <div>
                {data.map((transaction, index) => (
                  <div key={transaction.id || index}>
                    <RecentTransactionsTableRow
                      pathname={type}
                      transaction={transaction}
                      deleteMutation={deleteMutation}
                      convertMutation={convertMutation}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <ReceiptIndianRupee className="bg-secondary text-foreground mx-auto mb-6 h-12 w-12 rounded-lg p-2" />
                <p className="text-muted-foreground text-xl font-medium">No transactions found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
