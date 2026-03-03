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
import type { MutationVariables, StatusMutationVariables } from "@/hooks/customers/useCustomers";
import { TRANSACTION_TYPE, type CustomerTransaction, type TransactionType } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatToRupees } from "@shared/utils/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  CircleCheckBig,
  CircleOff,
  Download,
  Edit,
  Eye,
  LoaderCircle,
  MoreVertical,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomerTableRow = ({
  type,
  transaction,
  isLoaderRow,
  hasNextPage,
  deleteMutation,
  convertMutation,
  txnStatusMutation,
  setIsViewModalOpen,
  setTransactionId
}: {
  type: TransactionType;
  transaction: CustomerTransaction;
  isLoaderRow: boolean;
  hasNextPage: boolean;
  deleteMutation: UseMutationResult<null, Error, MutationVariables>;
  convertMutation: UseMutationResult<null, Error, MutationVariables>;
  txnStatusMutation: UseMutationResult<{ message: string }, Error, StatusMutationVariables>;
  setIsViewModalOpen: (value: boolean) => void;
  setTransactionId: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<"status" | "convert" | "delete" | "idle">(
    "idle"
  );

  const handleView = useCallback(() => {
    setIsViewModalOpen(true);
    setTransactionId(transaction.id);
  }, [setIsViewModalOpen, setTransactionId, transaction.id]);

  const handleEdit = useCallback(() => {
    type === TRANSACTION_TYPE.SALE
      ? navigate(`/billing/sales/${transaction.id}/edit`)
      : navigate(`/billing/estimates/${transaction.id}/edit`);
  }, [navigate, transaction.id, type]);

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ type: type, id: transaction.id });
  }, [deleteMutation, type, transaction.id]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type: type, id: transaction.id });
  }, [convertMutation, type, transaction.id]);

  const handleStatus = useCallback(() => {
    txnStatusMutation.mutate({
      type: type,
      id: transaction.id,
      isPaid: !transaction.isPaid
    });
  }, [txnStatusMutation, type, transaction.id, transaction.isPaid]);

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
        <div className="hover:bg-muted/40 bg-card border-border/50 grid grid-cols-9 gap-2 border-b px-4 py-2 text-lg">
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

          <div className="text-muted-foreground col-span-2 flex items-center font-medium">
            # {transaction.transactionNo}
          </div>
          <div className="col-span-2 flex items-center font-semibold">
            {transaction.grandTotal ? formatToRupees(transaction.grandTotal) : "-"}
          </div>
          <div className="col-span-1 flex items-center">
            {transaction.isPaid ? (
              <Badge className="bg-success/10 text-success border-success/20 text-sm">Paid</Badge>
            ) : (
              <Badge className="border-destructive/20 bg-destructive/10 text-destructive text-sm">
                Unpaid
              </Badge>
            )}
          </div>
          <div className="col-span-2 flex items-center justify-end gap-0.5">
            <Tooltip>
              <TooltipTrigger
                onClick={handleView}
                className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-1.5"
              >
                <Eye size={18} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-base">View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                onClick={handleEdit}
                className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-1.5"
              >
                <Edit size={18} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-base">Edit</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                onClick={() => setActiveDialog("delete")}
                className="hover:bg-accent text-destructive cursor-pointer rounded-md p-1.5"
              >
                <Trash2 size={18} />
              </TooltipTrigger>
            </Tooltip>

            <AlertDialog
              open={activeDialog === "delete"}
              onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
            >
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

            <AlertDialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Are you absolutely sure?</AlertDialogTitle>
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

            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer rounded-md p-1.5">
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-55" align="end">
                <DropdownMenuItem
                  onSelect={() => handleStatus()}
                  className="cursor-pointer"
                  disabled={txnStatusMutation.isPending}
                >
                  {transaction.isPaid ? (
                    <>
                      <CircleOff className="mr-1 h-4 w-4" />
                      <span className="text-lg">Mark as unpaid</span>
                    </>
                  ) : (
                    <>
                      <CircleCheckBig className="mr-1 h-4 w-4" />
                      <span className="text-lg">Mark as paid</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => setActiveDialog("convert")}
                  className="cursor-pointer"
                >
                  <RefreshCcw className="mr-1 h-4 w-4" />
                  <span className="text-lg">Convert</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem disabled>
                  <Download className="mr-1 h-4 w-4" />
                  <span className="text-lg">Download</span>
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
                      : type === TRANSACTION_TYPE.SALE
                        ? "Convert to Estimate"
                        : "Convert to Sale"}
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
  if (p.grandTotal !== n.grandTotal) return false;
  if (p.isPaid !== n.isPaid) return false;
  if (p.createdAt !== n.createdAt) return false;

  if (prev.deleteMutation?.isPending !== next.deleteMutation?.isPending) return false;
  if (prev.convertMutation?.isPending !== next.convertMutation?.isPending) return false;
  if (prev.txnStatusMutation?.isPending !== next.txnStatusMutation?.isPending) return false;

  return true;
}

export default memo(CustomerTableRow, memoComparator);
