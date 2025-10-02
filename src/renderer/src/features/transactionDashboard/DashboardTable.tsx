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
import { sortOptions } from "@/constants";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useDateRangePicker } from "@/hooks/dashboard/useDateRangePicker";
import type {
  DateRangeType,
  NextCursor,
  PaginatedApiResponse,
  SalesType,
  SortType
} from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ReceiptIndianRupee, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { DateRangePicker } from "./DateRangePicker";

const fetchSales = async (dateRange: DateRangeType, sortBy: SortType, cursor: NextCursor) => {
  try {
    const response = await window.salesApi.getSalesDateRange(dateRange, sortBy, cursor);
    if (response.status === "success") {
      return response;
    }
    throw new Error(response.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const DashboardTable = () => {
  const {
    navigate,
    pathname,
    sales,
    estimates,
    sortBy,
    setSortBy,
    dataToRender,
    handleDeleteSale,
    handleDeleteEstimate,
    handleSaleConvert,
    handleEstimateConvert
  } = useDashboard();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { date } = useDateRangePicker();

  const {
    data: transactionData,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isError,
    status
  } = useInfiniteQuery({
    queryKey: ["sales", date],
    queryFn: ({ pageParam }) => fetchSales(date as DateRangeType, sortBy, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage: PaginatedApiResponse<SalesType[] | []>) => {
      return lastPage.status === "success" ? (lastPage.nextCursor ?? null) : null;
    },
    select: (rawData) => {
      return rawData.pages.flatMap((page) => page.data);
    }
  });

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || isLoading) {
      return;
    }

    // TODO: add how percentage is calculated
    const scrollPercent =
      (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;

    if (scrollPercent >= 80) {
      console.log("here");
      fetchNextPage();

      // handleFetch(debouncedSearchParam, pageNo, "append");
    }
    // adding `pageNo` to deps is causing fetch two page at one time
  }, [fetchNextPage, isLoading]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  // const { inView, ref } = useInView({
  //   threshold: 0.9,
  //   skip: isLoading || !hasNextPage,
  //   delay: 500
  // });

  // useEffect(() => {
  //   console.log("here");
  //   if (isError) return;
  //   if (isLoading) return;
  //   if (transactionData?.length === 0) return;
  //   if (inView) {
  //     fetchNextPage();
  //   }
  // }, [inView, isError, isLoading]);

  // useEffect(() => {
  //   console.log(transactionData, error, fetchNextPage, status);
  // }, []);

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
              <Select
                value={sortBy}
                defaultValue={sortBy}
                onValueChange={(value: SortType) => setSortBy(value)}
              >
                <SelectTrigger className="text-foreground !h-11 w-[220px] text-base font-semibold">
                  <SelectValue placeholder="Date (Newest First)" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((s, idx) => (
                    <SelectItem key={idx} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DateRangePicker />
            </div>
          </div>
          <div className="pb-2 pl-1 text-blue-600">
            {pathname === "/sale"
              ? `Showing ${sales.length || 0} results`
              : `Showing ${estimates.length || 0} results`}
          </div>
          {transactionData && transactionData.length > 0 ? (
            <div ref={scrollRef} className="max-h-[57vh] overflow-y-auto rounded-lg border">
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
                  {transactionData.map((transaction: any) => (
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
