import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MutationVariables, StatusMutationVariables } from "@/hooks/dashboard/useDashboard";
import { getCustomerAvatarStyle } from "@/lib/customerAvatar";
import { cn } from "@/lib/utils";
import type { UnifiedTransaction } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CircleCheckBig,
  CircleOff,
  Copy,
  Edit,
  Eye,
  FileDown,
  Loader2,
  LoaderCircle,
  MoreVertical,
  Printer,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

const DashboardTableRow = ({
  pathname,
  transaction,
  isLoaderRow,
  hasNextPage,
  deleteMutation,
  convertMutation,
  txnStatusMutation,
  duplicateMutation,
  setIsViewModalOpen,
  setTransactionId
}: {
  pathname: string;
  transaction: Omit<UnifiedTransaction, "customer"> & { customerName: string };
  isLoaderRow: boolean;
  hasNextPage: boolean;
  deleteMutation: UseMutationResult<null, Error, MutationVariables>;
  convertMutation: UseMutationResult<{ id: string }, Error, MutationVariables>;
  txnStatusMutation: UseMutationResult<{ message: string }, Error, StatusMutationVariables>;
  duplicateMutation: UseMutationResult<{ id: string }, Error, MutationVariables>;
  setIsViewModalOpen: (value: boolean) => void;
  setTransactionId: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState<"status" | "convert" | "delete" | "idle">(
    "idle"
  );

  const handleView = useCallback(() => {
    setIsViewModalOpen(true);
    setTransactionId(transaction.id);
  }, [setIsViewModalOpen, setTransactionId, transaction]);

  const handleEdit = useCallback(() => {
    if (pathname === "sales") {
      navigate(`/billing/sales/${transaction.id}/edit`);
    } else {
      navigate(`/billing/estimates/${transaction.id}/edit`);
    }
  }, [navigate, transaction.id, pathname]);

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ type: transaction.type, id: transaction.id });
  }, [deleteMutation, transaction.type, transaction.id]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type: transaction.type, id: transaction.id });
  }, [convertMutation, transaction.type, transaction.id]);

  const onDuplicate = useCallback(() => {
    duplicateMutation.mutate({ type: transaction.type, id: transaction.id });
  }, [duplicateMutation, transaction.type, transaction.id]);

  const handleStatus = useCallback(() => {
    txnStatusMutation.mutate({
      type: transaction.type,
      id: transaction.id,
      isPaid: !transaction.isPaid
    });
  }, [txnStatusMutation, transaction.type, transaction.id, transaction.isPaid]);

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleSavePdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const response = await window.exportApi.exportAsPdf(transaction.id, transaction.type);
      if (response?.status === "success") {
        const filePath = response.data;
        toast.success(
          (t) => (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-medium">PDF saved successfully</span>
              <button
                onClick={() => {
                  window.exportApi.showItemInFolder(filePath);
                  toast.dismiss(t.id);
                }}
                className="text-foreground/70 hover:text-foreground inline-flex items-center gap-0.5 text-sm font-medium transition-colors hover:underline"
              >
                Open
                <ArrowUpRight size={14} />
              </button>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.error(response?.error?.message || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF Export failed", error);
      toast.error("Failed to export PDF");
    } finally {
      setPdfLoading(false);
    }
  }, [transaction.id, transaction.type]);

  const customerIdentity = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-(--radius-control) text-xs font-semibold",
          getCustomerAvatarStyle(transaction.customerId, transaction.customerName)
        )}
      >
        {transaction.customerName.charAt(0).toUpperCase()}
      </span>
      <span className="text-foreground truncate text-sm font-medium">
        {transaction.customerName}
      </span>
    </>
  );

  return (
    <div>
      {isLoaderRow ? (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          {hasNextPage ? (
            <div className="flex items-center justify-center py-4">
              <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
              <span className="text-muted-foreground ml-2 text-xs">Loading more…</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-card hover:bg-muted/50 active:bg-muted border-border grid min-h-11 grid-cols-12 items-center gap-2 border-b px-3 py-1 text-sm transition-colors">
          <div className="col-span-2 flex flex-col justify-center">
            <span className="text-foreground text-sm leading-tight font-semibold tabular-nums">
              {transaction.createdAt
                ? formatDateStrToISTDateStr(transaction.createdAt).fullDate
                : "-"}
            </span>
            <span className="text-muted-foreground text-sm leading-tight tabular-nums">
              {transaction.createdAt
                ? formatDateStrToISTDateStr(transaction.createdAt).timePart
                : "-"}
            </span>
          </div>
          <div className="col-span-3 flex items-center gap-2">
            {transaction.customerId ? (
              <Link
                to={`/customers/${transaction.customerId}`}
                className="focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-(--radius-control) outline-none hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {customerIdentity}
              </Link>
            ) : (
              <div className="flex min-w-0 items-center gap-2">{customerIdentity}</div>
            )}
          </div>

          <div className="text-muted-foreground col-span-2 flex items-center text-sm tabular-nums">
            #{transaction.transactionNo}
          </div>
          <div className="text-foreground col-span-2 flex items-center text-sm font-semibold tabular-nums">
            {transaction.grandTotal ? formatRupee(transaction.grandTotal) : "-"}
          </div>
          <div className="col-span-1 flex items-center justify-start">
            {transaction.isPaid ? (
              <Badge className="bg-success/10 text-success border-success/20 text-xs">Paid</Badge>
            ) : (
              <Badge className="border-destructive/20 bg-destructive/10 text-destructive text-xs">
                Unpaid
              </Badge>
            )}
          </div>
          <div className="col-span-2 flex items-center justify-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                onClick={handleView}
                className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-1.5"
              >
                <Eye className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                onClick={handleEdit}
                className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-1.5"
              >
                <Edit className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Edit</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                onClick={() => setActiveDialog("delete")}
                className="hover:bg-accent text-destructive cursor-pointer rounded-md p-1.5"
              >
                <Trash2 className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Delete</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog
              open={activeDialog === "delete"}
              onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This will permanently delete the transaction.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                    onClick={onDelete}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-1.5">
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" align="end">
                <DropdownMenuItem
                  onSelect={() => handleStatus()}
                  className="cursor-pointer"
                  disabled={txnStatusMutation.isPending}
                >
                  {transaction.isPaid ? (
                    <>
                      <CircleOff className="mr-2 size-4" />
                      <span className="text-sm">Mark as unpaid</span>
                    </>
                  ) : (
                    <>
                      <CircleCheckBig className="mr-2 size-4" />
                      <span className="text-sm">Mark as paid</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => setActiveDialog("convert")}
                  className="cursor-pointer"
                >
                  <RefreshCcw className="mr-2 size-4" />
                  <span className="text-sm">Convert</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => onDuplicate()}
                  className="cursor-pointer"
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="mr-2 size-4" />
                  <span className="text-sm">Duplicate</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleSavePdf}
                  className="cursor-pointer"
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 size-4" />
                  )}
                  <span className="text-sm">{pdfLoading ? "Exporting…" : "Export PDF"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled>
                  <Printer className="mr-2 size-4" />
                  <span className="text-sm">Print</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
              open={activeDialog === "convert"}
              onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This will permanently convert the transaction.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
                    onClick={onConvert}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending
                      ? "Converting..."
                      : pathname === "sales"
                        ? "Convert to Estimate"
                        : pathname === "estimates"
                          ? "Convert to Sale"
                          : ""}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={activeDialog === "status"}
              onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This will permanently convert the transaction.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
                    onClick={onConvert}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending
                      ? "Converting..."
                      : pathname === "sales"
                        ? "Convert to Estimate"
                        : pathname === "estimates"
                          ? "Convert to Sale"
                          : ""}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
};

// component renders only when returned false
function memoComparator(prev: any, next: any) {
  if (prev.isLoaderRow !== next.isLoaderRow) return false;
  if (prev.hasNextPage !== next.hasNextPage) return false;

  if (prev.isLoaderRow && next.isLoaderRow) return true;

  const p = prev.transaction || {};
  const n = next.transaction || {};

  if (p?.id !== n?.id) return false;
  if (p.transactionNo !== n.transactionNo) return false;
  if (p.customerId !== n.customerId) return false;
  if (p.customerName !== n.customerName) return false;
  if (p.grandTotal !== n.grandTotal) return false;
  if (p.isPaid !== n.isPaid) return false;
  if (p.createdAt !== n.createdAt) return false;

  if (prev.deleteMutation?.isPending !== next.deleteMutation?.isPending) return false;
  if (prev.convertMutation?.isPending !== next.convertMutation?.isPending) return false;
  if (prev.duplicateMutation?.isPending !== next.duplicateMutation?.isPending) return false;

  return true;
}

export default memo(DashboardTableRow, memoComparator);
