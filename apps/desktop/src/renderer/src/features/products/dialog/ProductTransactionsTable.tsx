import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PAGE_SIZE,
  useProductTransactions
} from "@/features/products/hooks/useProductTransactions";
import { useProductsStore } from "@/features/products/products.store";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import { DASHBOARD_TYPE, TRANSACTION_TYPE, type ProductTransaction } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ReceiptText
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback } from "react";

export function ProductTransactionsTable() {
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);
  const setTransactionType = useViewModalStore((state) => state.setTransactionType);
  const productId = useProductsStore((state) => state.productId);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    pageNo,
    totalCount,
    hasNextPage,
    hasPrevPage,
    goToNextPage,
    goToPrevPage
  } = useProductTransactions(productId);

  const handleOpenTransaction = useCallback(
    (transaction: ProductTransaction) => {
      const dashboardType =
        transaction.type === TRANSACTION_TYPE.SALE
          ? DASHBOARD_TYPE.SALES
          : DASHBOARD_TYPE.ESTIMATES;

      if (!transaction.id) return;

      setTransactionType(dashboardType);
      setTransactionId(transaction.id);
      setIsViewModalOpen(true);
    },
    [setIsViewModalOpen, setTransactionId, setTransactionType]
  );

  if (!productId) return null;

  if (isLoading && !data) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground/50 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground font-medium">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive flex h-full w-full flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-4 h-10 w-10 opacity-80" />
        <p className="text-lg font-semibold">Failed to load transactions</p>
        <p className="text-destructive/80 mt-1 text-sm">
          {error?.message || "Please try again later."}
        </p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="mt-4 cursor-pointer gap-2 text-sm font-semibold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const transactions = data?.data ?? [];

  if (transactions.length === 0 && pageNo === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex h-full w-full flex-col items-center justify-center"
      >
        <div className="bg-secondary mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm">
          <ReceiptText className="text-muted-foreground/50 h-8 w-8" />
        </div>
        <h3 className="text-foreground mb-2 text-xl font-bold tracking-tight">
          No Transactions Yet
        </h3>
        <p className="text-muted-foreground max-w-xs text-center text-[0.95rem]">
          This product hasn&apos;t been part of any sales or estimates yet.
        </p>
      </motion.div>
    );
  }

  const startItem = (pageNo - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(pageNo * PAGE_SIZE, totalCount);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-5">
        <div className="border-border/60 bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-md">
          <div className="bg-muted text-muted-foreground grid shrink-0 grid-cols-12 gap-4 rounded-t-lg px-6 py-2.5 text-base font-semibold">
            <div className="col-span-2 flex items-center">Date</div>
            <div className="col-span-1 flex items-center">Type</div>
            <div className="col-span-1 flex items-center">No.</div>
            <div className="col-span-3 flex items-center">Customer</div>
            <div className="col-span-1 flex items-center justify-end">Qty</div>
            <div className="col-span-1 flex items-center justify-end">Price</div>
            <div className="col-span-2 flex items-center justify-end">Total</div>
            <div className="col-span-1 flex items-center justify-end"></div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {transactions.map((txn, idx) => (
              <motion.div
                key={`${txn.type}-${txn.transactionNo}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: idx * 0.025,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className="hover:bg-muted/40 bg-card border-border/50 grid min-h-12 grid-cols-12 items-center gap-3 border-b px-3 py-1 text-sm"
              >
                <div className="col-span-2 flex flex-col items-start justify-center">
                  <span className="text-foreground text-base font-semibold">
                    {txn.createdAt ? formatDateStrToISTDateStr(txn.createdAt).fullDate : "-"}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {txn.createdAt ? formatDateStrToISTDateStr(txn.createdAt).timePart : "-"}
                  </span>
                </div>

                <div className="col-span-1 flex items-center">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${
                      txn.type === TRANSACTION_TYPE.SALE
                        ? "bg-success/10 text-success"
                        : "bg-info/10 text-info"
                    }`}
                  >
                    {txn.type === TRANSACTION_TYPE.SALE ? "Sale" : "Estimate"}
                  </span>
                </div>

                <div className="text-muted-foreground col-span-1 flex items-center font-medium">
                  # {txn.transactionNo}
                </div>

                <div className="col-span-3 flex items-center gap-2.5 font-medium">
                  <div className="bg-accent text-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                    {txn.customerName.charAt(0)}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground cursor-default truncate text-base font-semibold">
                        {txn.customerName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-base font-medium">{txn.customerName}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="text-product-label col-span-1 flex items-center justify-end text-base font-medium tabular-nums">
                  {fromMilliUnits(txn.quantity)}
                </div>

                <div className="text-product-label col-span-1 flex items-center justify-end text-base font-medium tabular-nums">
                  {formatRupee(txn.price)}
                </div>

                <div className="text-foreground col-span-2 flex items-center justify-end text-base font-bold tabular-nums">
                  {formatRupee(txn.totalPrice)}
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <Tooltip>
                    <TooltipTrigger
                      onClick={() => handleOpenTransaction(txn)}
                      aria-label={`Open ${txn.type} transaction ${txn.transactionNo}`}
                      className="bg-secondary/60 text-muted-foreground/80 border-border/50 hover:bg-secondary hover:text-foreground hover:border-border inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all duration-150 hover:scale-105"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-base">Open transaction</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <p className="text-muted-foreground text-sm">
          Showing <span className="text-foreground font-medium">{startItem}</span>–
          <span className="text-foreground font-medium">{endItem}</span> of{" "}
          <span className="text-foreground font-medium">{totalCount}</span> results
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={!hasPrevPage}
            className="cursor-pointer gap-1 px-3 text-sm font-medium transition-all duration-150 active:scale-[0.97]"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!hasNextPage}
            className="cursor-pointer gap-1 px-3 text-sm font-medium transition-all duration-150 active:scale-[0.97]"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
