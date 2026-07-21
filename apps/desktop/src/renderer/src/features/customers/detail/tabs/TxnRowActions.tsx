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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CustomerTxn } from "@/hooks/customers/useCustomerTransactions";
import type {
  MutationVariables,
  StatusMutationVariables
} from "@/hooks/customers/useCustomerTxnMutations";
import { useViewModalStore } from "@/store/viewModalStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
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
  MoreVertical,
  Printer,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type TxnRowActionsProps = {
  txn: CustomerTxn;
  type: TransactionType;
  deleteMutation: UseMutationResult<null, Error, MutationVariables>;
  convertMutation: UseMutationResult<{ id: string }, Error, MutationVariables>;
  txnStatusMutation: UseMutationResult<{ message: string }, Error, StatusMutationVariables>;
  duplicateMutation: UseMutationResult<{ id: string }, Error, MutationVariables>;
};

function TxnRowActionsInner({
  txn,
  type,
  deleteMutation,
  convertMutation,
  txnStatusMutation,
  duplicateMutation
}: TxnRowActionsProps) {
  const navigate = useNavigate();
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);
  const [activeDialog, setActiveDialog] = useState<"delete" | "convert" | "idle">("idle");
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleView = useCallback(() => {
    setTransactionId(txn.id);
    setIsViewModalOpen(true);
  }, [setIsViewModalOpen, setTransactionId, txn.id]);

  const handleEdit = useCallback(() => {
    const path = type === TRANSACTION_TYPE.SALE ? "sales" : "estimates";
    navigate(`/billing/${path}/${txn.id}/edit`);
  }, [navigate, type, txn.id]);

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ type, id: txn.id });
  }, [deleteMutation, type, txn.id]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type, id: txn.id });
  }, [convertMutation, type, txn.id]);

  const onDuplicate = useCallback(() => {
    duplicateMutation.mutate({ type, id: txn.id });
  }, [duplicateMutation, type, txn.id]);

  const onStatusToggle = useCallback(() => {
    txnStatusMutation.mutate({ type, id: txn.id, isPaid: !txn.isPaid });
  }, [txnStatusMutation, type, txn.id, txn.isPaid]);

  const handleSavePdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const response = await window.exportApi.exportAsPdf(txn.id, type);
      if (response?.status === "success") {
        const filePath = response.data;
        toast.success(
          (t) => (
            <div className="flex items-center gap-4 whitespace-nowrap">
              <span className="font-medium">PDF saved successfully</span>
              <button
                onClick={() => {
                  window.exportApi.showItemInFolder(filePath);
                  toast.dismiss(t.id);
                }}
                className="text-foreground/70 hover:text-foreground inline-flex items-center gap-0.5 text-xl font-medium transition-colors hover:underline"
              >
                Open
                <ArrowUpRight size={18} />
              </button>
            </div>
          ),
          { duration: 4000, style: { maxWidth: "fit-content" } }
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
  }, [txn.id, type]);

  return (
    <div className="flex items-center justify-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleView}
            className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors"
          >
            <Eye className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>View</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleEdit}
            className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors"
          >
            <Edit className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setActiveDialog("delete")}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-md p-1.5 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={onStatusToggle}
            className="cursor-pointer"
            disabled={txnStatusMutation.isPending}
          >
            {txn.isPaid ? (
              <>
                <CircleOff className="mr-1.5 size-4" />
                <span>Mark as unpaid</span>
              </>
            ) : (
              <>
                <CircleCheckBig className="mr-1.5 size-4" />
                <span>Mark as paid</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setActiveDialog("convert")} className="cursor-pointer">
            <RefreshCcw className="mr-1.5 size-4" />
            <span>Convert to {type === TRANSACTION_TYPE.SALE ? "Estimate" : "Sale"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={onDuplicate}
            className="cursor-pointer"
            disabled={duplicateMutation.isPending}
          >
            <Copy className="mr-1.5 size-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={handleSavePdf}
            className="cursor-pointer"
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <FileDown className="mr-1.5 size-4" />
            )}
            <span>{pdfLoading ? "Exporting…" : "Export PDF"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem disabled>
            <Printer className="mr-1.5 size-4" />
            <span>Print</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={activeDialog === "delete"}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="text-foreground font-medium">#{txn.transactionNo}</span>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
              onClick={onDelete}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={activeDialog === "convert"}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert this {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new {type === TRANSACTION_TYPE.SALE ? "estimate" : "sale"} from{" "}
              <span className="text-foreground font-medium">#{txn.transactionNo}</span>.
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
                ? "Converting…"
                : `Convert to ${type === TRANSACTION_TYPE.SALE ? "Estimate" : "Sale"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function memoComparator(prev: any, next: any) {
  if (prev.type !== next.type) return false;
  const p = prev.txn || {};
  const n = next.txn || {};
  if (p.id !== n.id) return false;
  if (p.isPaid !== n.isPaid) return false;
  if (p.grandTotal !== n.grandTotal) return false;
  if (p.totalQuantity !== n.totalQuantity) return false;
  if (prev.deleteMutation?.isPending !== next.deleteMutation?.isPending) return false;
  if (prev.convertMutation?.isPending !== next.convertMutation?.isPending) return false;
  if (prev.duplicateMutation?.isPending !== next.duplicateMutation?.isPending) return false;
  if (prev.txnStatusMutation?.isPending !== next.txnStatusMutation?.isPending) return false;
  return true;
}

export const TxnRowActions = memo(TxnRowActionsInner, memoComparator);
