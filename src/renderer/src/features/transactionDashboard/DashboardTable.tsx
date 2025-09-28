import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useDashboardStore } from "@/store/salesStore";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import { ReceiptIndianRupee, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { DatePicker } from "./DatePicker";

export const DashboardTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const sales = useDashboardStore((state) => state.sales);
  const setSales = useDashboardStore((state) => state.setSales);
  const estimates = useDashboardStore((state) => state.estimates);
  const setEstimates = useDashboardStore((state) => state.setEstimates);
  const dataToRender = pathname === "/sale" ? sales : estimates;

  const handleDeleteSale = async (saleId: string) => {
    try {
      const response = await window.salesApi.deleteSale(saleId);
      if (response.status === "success") {
        toast.success("Successfully deleted sale");
        if (sales.length > 0) {
          setSales(sales.filter((sale) => sale.id !== saleId));
        }
      } else {
        toast.error(response.error.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleDeleteEstimate = async (estimateId: string) => {
    try {
      const response = await window.estimatesApi.deleteEstimate(estimateId);
      if (response.status === "success") {
        toast.success("Successfully deleted estimate");
        if (estimates.length > 0) {
          setEstimates(estimates.filter((estimate) => estimate.id !== estimateId));
        }
      } else {
        toast.error(response.error.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleSaleConvert = async (saleId: string) => {
    try {
      const response = await window.salesApi.convertSaletoEstimate(saleId);
      if (response.status === "success") {
        toast.success(response.data);
        if (sales.length > 0) {
          setSales(sales.filter((sale) => sale.id !== saleId));
        }
      } else {
        toast.error(response.error.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleEstimateConvert = async (estimateId: string) => {
    try {
      const response = await window.estimatesApi.convertEstimateToSale(estimateId);
      if (response.status === "success") {
        toast.success(response.data);
        if (estimates.length > 0) {
          setEstimates(estimates.filter((estimate) => estimate.id !== estimateId));
        }
      } else {
        toast.error(response.error.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <Card className="my-0 py-4">
        <CardContent>
          <div className="flex items-center justify-between gap-3 pt-2 pb-5">
            <div className="relative w-full max-w-lg">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search sales by customer, amount or invoice No"
                className="bg-background border-border/50 focus:border-primary/50 py-5 pl-10 !text-lg font-medium"
              />
            </div>
            <div className="flex h-full w-full items-center justify-end gap-3">
              <div className="text-muted-foreground text-md font-medium">Sort by: </div>
              <Select>
                <SelectTrigger className="text-foreground !h-11 w-[220px] text-base font-semibold">
                  <SelectValue placeholder="Date (Newest First)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_newest_first">Date (Newest first)</SelectItem>
                  <SelectItem value="date_oldest_first">Date (Oldest first)</SelectItem>
                  <SelectItem value="high_to_low">Amount (High to Low)</SelectItem>
                  <SelectItem value="low_to_high">Amount (Low to High)</SelectItem>
                  <SelectItem value="status_unpaid">Status (Unpaid)</SelectItem>
                  <SelectItem value="status_paid">Status (Paid)</SelectItem>
                </SelectContent>
              </Select>
              <DatePicker />
            </div>
          </div>
          <div className="pb-2 pl-1 text-blue-600">
            {pathname === "/sale"
              ? `Showing ${sales.length || 0} results`
              : `Showing ${estimates.length || 0} results`}
          </div>
          {dataToRender.length > 0 ? (
            <div className="max-h-[415px] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-lg font-semibold">Date</TableHead>
                    <TableHead className="text-lg font-semibold">
                      {pathname === "/sale" ? "Invoice No" : "Estimate No"}
                    </TableHead>
                    <TableHead className="text-lg font-semibold">Name</TableHead>
                    <TableHead className="text-lg font-semibold">Amount</TableHead>
                    <TableHead className="text-lg font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataToRender.map((transaction) => (
                    <TableRow key={transaction.id} className="h-14">
                      <TableCell className="py-4">
                        <Badge variant="outline" className="px-3 py-1 text-lg capitalize">
                          {formatDateStrToISTDateStr(transaction.createdAt)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {transaction.invoiceNo || transaction.estimateNo}
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {transaction.customer.name}
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {IndianRupees.format(transaction.grandTotal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="link" className="text-primary px-0 text-lg">
                                Convert
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently convert the transaction.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    pathname === "/sale"
                                      ? handleSaleConvert(transaction.id)
                                      : handleEstimateConvert(transaction.id);
                                  }}
                                >
                                  Confirm Convert
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            size="sm"
                            onClick={() => {
                              pathname === "/sale"
                                ? navigate(`/sales/edit/${transaction.id}`)
                                : navigate(`/estimates/edit/${transaction.id}`);
                            }}
                          >
                            View
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-9 w-9 hover:cursor-pointer"
                              >
                                <Trash2 className="h-8 w-8" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-900">
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-red-700">
                                  This will permanently delete the transaction.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/80"
                                  onClick={() => {
                                    pathname === "/sale"
                                      ? handleDeleteSale(transaction.id)
                                      : handleDeleteEstimate(transaction.id);
                                  }}
                                >
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
