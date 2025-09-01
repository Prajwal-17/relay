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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useDashboardStore } from "@/store/salesStore";
import { formatDateTimeToIST } from "@shared/utils";
import { ReceiptIndianRupee, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

export const DashboardTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const sales = useDashboardStore((state) => state.sales);
  const setSales = useDashboardStore((state) => state.setSales);
  const estimates = useDashboardStore((state) => state.estimates);
  const setEstimates = useDashboardStore((state) => state.setEstimates);
  const dataToRender = pathname === "/sale" ? sales : estimates;

  const IndianRupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  });

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

  const handleConvert = async (saleId: string) => {
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

  return (
    <>
      <Card className="my-0 py-3">
        <CardContent className="px-3">
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
                          {formatDateTimeToIST(transaction.createdAt)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {transaction.invoiceNo || transaction.estimateNo}
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {transaction.customerName}
                      </TableCell>
                      <TableCell className="py-4 text-left text-lg font-medium">
                        {IndianRupees.format(transaction.grandTotal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AlertDialog>
                            <AlertDialogTrigger>
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
                                <AlertDialogAction onClick={() => handleConvert(transaction.id)}>
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
                            <AlertDialogTrigger>
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
