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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MutationVariables } from "@/features/transactions/hooks/useDashboard";
import { getCustomerAvatarStyle } from "@/features/customers/customerAvatar";
import { cn } from "@/lib/utils";
import { TRANSACTION_TYPE, type TransactionType, type UnifiedTransaction } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import { Download, Edit, Eye, MoreVertical, RefreshCcw, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

const RecentTransactionsTableRow = ({
  type,
  transaction,
  deleteMutation,
  convertMutation
}: {
  type: TransactionType;
  transaction: UnifiedTransaction;
  deleteMutation: UseMutationResult<null, Error, MutationVariables>;
  convertMutation: UseMutationResult<{ id: string }, Error, MutationVariables>;
}) => {
  const navigate = useNavigate();
  const canModify = type !== TRANSACTION_TYPE.SALE || transaction.canModify !== false;
  const handleEdit = useCallback(() => {
    if (type === TRANSACTION_TYPE.SALE) {
      navigate(`/billing/sales/${transaction.id}/edit`);
    } else {
      navigate(`/billing/estimates/${transaction.id}/edit`);
    }
  }, [navigate, transaction.id, type]);

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ type: type, id: transaction.id });
  }, [deleteMutation, type, transaction.id]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type: type, id: transaction.id });
  }, [convertMutation, type, transaction.id]);

  const customerIdentity = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold",
          getCustomerAvatarStyle(transaction.customerId, transaction.customer.name)
        )}
      >
        {transaction.customer.name.charAt(0).toUpperCase()}
      </span>
      <span className="truncate">{transaction.customer.name}</span>
    </>
  );

  return (
    <div>
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

        <div className="text-muted-foreground col-span-2 flex items-center font-medium">
          # {transaction.transactionNo}
        </div>
        <div className="col-span-3 flex items-center font-semibold">
          {transaction.grandTotal ? formatRupee(transaction.grandTotal) : "-"}
        </div>
        <div className="col-span-2 flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger
              onClick={handleEdit}
              hidden={!canModify}
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
                <TooltipTrigger
                  hidden={!canModify}
                  className="hover:bg-accent text-destructive cursor-pointer rounded-md p-2"
                >
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
                    hidden={type !== TRANSACTION_TYPE.ESTIMATE}
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
                      {convertMutation.isPending ? "Converting..." : "Convert"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenuSeparator />

              <DropdownMenuItem disabled>
                <Eye className="mr-1 h-4 w-4" />
                <span className="text-lg">View</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="mr-1 h-4 w-4" />
                <span className="text-lg">Download</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
  if (p.customer?.name !== n.customer?.name) return false;
  if (p.grandTotal !== n.grandTotal) return false;
  if (p.createdAt !== n.createdAt) return false;
  if (p.canModify !== n.canModify) return false;

  if (prev.deleteMutation?.isPending !== next.deleteMutation?.isPending) return false;
  if (prev.convertMutation?.isPending !== next.convertMutation?.isPending) return false;

  return true;
}

export default memo(RecentTransactionsTableRow, memoComparator);
