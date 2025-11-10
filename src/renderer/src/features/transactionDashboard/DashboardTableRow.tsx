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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MutationVariables } from "@/hooks/dashboard/useDashboard";
import type { UnifiedTransaction } from "@/hooks/dashboard/useInfiniteScroll";
import type { ApiResponse } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  Download,
  Edit,
  Eye,
  LoaderCircle,
  MoreVertical,
  Printer,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const DashboardTableRow = ({
  pathname,
  transaction,
  isLoaderRow,
  hasNextPage,
  deleteMutation,
  convertMutation,
  setIsViewModalOpen,
  setTransactionId
}: {
  pathname: string;
  transaction: UnifiedTransaction;
  isLoaderRow: boolean;
  hasNextPage: boolean;
  deleteMutation: UseMutationResult<ApiResponse<string>, Error, MutationVariables>;
  convertMutation: UseMutationResult<ApiResponse<string>, Error, MutationVariables>;
  setIsViewModalOpen: (value: boolean) => void;
  setTransactionId: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const handleView = useCallback(() => {
    setIsViewModalOpen(true);
    setTransactionId(transaction.id);
  }, [setIsViewModalOpen, setTransactionId, transaction]);

  const handleEdit = useCallback(() => {
    pathname === "sales"
      ? navigate(`/billing/sales/edit/${transaction.id}`)
      : navigate(`/billing/estimates/edit/${transaction.id}`);
  }, [navigate, transaction.id, pathname]);

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ type: pathname, id: transaction.id });
  }, [deleteMutation, pathname, transaction.id]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type: pathname, id: transaction.id });
  }, [convertMutation, pathname, transaction.id]);

  return (
    <div>
      {isLoaderRow ? (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          {hasNextPage ? (
            <div className="my-8 flex justify-center gap-3">
              <div className="text-muted-foreground text-xl font-semibold">Loading</div>
              <LoaderCircle className="text-primary animate-spin" size={26} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="hover:bg-muted/40 bg-card border-border/50 grid grid-cols-12 gap-4 border-b px-6 py-2 text-lg">
          <div className="col-span-2 flex flex-col items-start justify-start font-medium">
            <span className="text-xl font-semibold">
              {transaction.createdAt
                ? formatDateStrToISTDateStr(transaction.createdAt).fullDate
                : "-"}
            </span>
            <span className="text-muted-foreground text-base">
              {transaction.createdAt
                ? formatDateStrToISTDateStr(transaction.createdAt).timePart
                : "-"}
            </span>
          </div>
          <div className="col-span-3 flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-200 text-purple-600">
              {transaction.customerName.charAt(0)}
            </div>
            <span className="truncate">{transaction.customerName}</span>
          </div>

          <div className="text-muted-foreground col-span-2 flex items-center font-medium">
            # {transaction.transactionNo}
          </div>
          <div className="col-span-2 flex items-center font-semibold">
            {transaction.grandTotal ? IndianRupees.format(transaction.grandTotal) : "-"}
          </div>
          <div className="col-span-1 flex items-center justify-start">
            {transaction.isPaid ? (
              <Badge className="bg-success/10 text-success border-success/20 text-sm">Paid</Badge>
            ) : (
              <Badge className="border-destructive/20 bg-destructive/10 text-destructive text-sm">
                Unpaid
              </Badge>
            )}
          </div>
          <div className="col-span-2 flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger
                onClick={handleView}
                className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-2"
              >
                <Eye size={20} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-base">View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                onClick={handleEdit}
                className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-2"
              >
                <Edit size={20} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-base">Edit</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog>
              <Tooltip>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger className="hover:bg-accent text-destructive cursor-pointer rounded-md p-2">
                    <Trash2 size={20} />
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <TooltipContent>
                  <p className="text-base">Delete</p>
                </TooltipContent>
              </Tooltip>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    This will permanently delete the transaction.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
                    onClick={onDelete}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-2">
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer"
                    >
                      <RefreshCcw className="mr-1 h-4 w-4 cursor-pointer" />
                      <span className="text-lg">Convert</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg">
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        This will permanently convert the transaction.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-primary hover:bg-primary/80 text-primary-foreground cursor-pointer"
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

                <DropdownMenuSeparator />

                <DropdownMenuItem disabled>
                  <Printer className="mr-1 h-4 w-4" />
                  <span className="text-lg">Print</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Download className="mr-1 h-4 w-4" />
                  <span className="text-lg">Download</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
  if (p.customerName !== n.customerName) return false;
  if (p.grandTotal !== n.grandTotal) return false;
  if (p.isPaid !== n.isPaid) return false;
  if (p.createdAt !== n.createdAt) return false;

  if (prev.deleteMutation?.isPending !== next.deleteMutation?.isPending) return false;
  if (prev.convertMutation?.isPending !== next.convertMutation?.isPending) return false;

  return true;
}

export default memo(DashboardTableRow, memoComparator);
