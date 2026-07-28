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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useViewModal } from "@/hooks/dashboard/useViewModal";
import { useViewModalStore } from "@/store/viewModalStore";
import { cn } from "@/lib/utils";
import { BATCH_CHECK_ACTION, type DashboardType } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import {
  ArrowUpRight,
  CheckCheck,
  Copy,
  Edit,
  FileDown,
  Loader2,
  LoaderCircle,
  MoreVertical,
  RefreshCcw,
  Trash2,
  X
} from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ItemRow } from "./ItemRow";

const customerTypeBadgeClass: Record<string, string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

function formatRelativeTime(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return null;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDateStrToISTDateTimeStr(dateStr);
}

type ConfirmDialog = "delete" | "convert" | "idle";

export const ViewModal = ({ type, id }: { type: DashboardType; id: string }) => {
  const navigate = useNavigate();
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);

  const {
    data,
    isLoading,
    subtotal,
    grandTotal,
    itemsCount,
    totalQty,
    totalCheckedQty,
    updateQtyMutation,
    batchUpdateQtyMutation,
    deleteMutation,
    convertMutation,
    duplicateMutation,
    exportPdf,
    pdfLoading
  } = useViewModal({ type, id });

  const [activeDialog, setActiveDialog] = useState<ConfirmDialog>("idle");

  const close = useCallback(() => setIsViewModalOpen(false), [setIsViewModalOpen]);

  const isSales = type === "sales";
  const canModify = !isSales || data?.canModify !== false;
  const convertLabel = "Convert to Sale";

  const handleEdit = useCallback(() => {
    close();
    navigate(`/billing/${type}/${id}/edit`);
  }, [close, navigate, type, id]);

  const handleCustomerOpen = useCallback(() => {
    if (!data?.customerId) return;
    close();
    navigate(`/customers/${data.customerId}`);
  }, [close, navigate, data?.customerId]);

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ type, id }, { onSettled: () => close() });
  }, [deleteMutation, type, id, close]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type, id }, { onSettled: () => close() });
  }, [convertMutation, type, id, close]);

  const onDuplicate = useCallback(() => {
    duplicateMutation.mutate({ type, id });
  }, [duplicateMutation, type, id]);

  const handleExportPdf = useCallback(async () => {
    const filePath = await exportPdf();
    if (!filePath) return;
    toast.success(
      (t) => (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">PDF saved successfully</span>
          <button
            onClick={() => {
              window.exportApi.showItemInFolder(filePath);
              toast.dismiss(t.id);
            }}
            className="text-foreground/70 hover:text-foreground inline-flex items-center gap-0.5 text-sm font-medium transition-colors hover:underline"
          >
            Open
            <ArrowUpRight size={16} />
          </button>
        </div>
      ),
      { duration: 4000 }
    );
  }, [exportPdf]);

  const updatedRelative = formatRelativeTime(data?.updatedAt);
  const createdAbsolute = data?.createdAt ? formatDateStrToISTDateTimeStr(data.createdAt) : null;
  const isModified = data?.updatedAt && data?.createdAt && data.updatedAt !== data.createdAt;

  const customerOutstanding = data?.customer.outstandingBalance ?? 0;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="bg-card flex max-h-[95vh] w-full min-w-3xl flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        {/* ---- Header ---- */}
        <div className="border-border bg-card flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-foreground truncate text-xl font-semibold tracking-[-0.02em]">
                {isSales ? "Sale" : "Estimate"} Details
              </h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {isSales ? "Invoice" : "Estimate"} No.{" "}
              <span className="text-foreground font-semibold tabular-nums">
                #{data?.transactionNo ?? "—"}
              </span>
              {createdAbsolute && (
                <>
                  <span className="text-muted-foreground/60 mx-1.5">·</span>
                  <span>Created {createdAbsolute}</span>
                </>
              )}
              {isModified && updatedRelative && (
                <>
                  <span className="text-muted-foreground/60 mx-1.5">·</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default underline-offset-2 hover:underline">
                        Updated {updatedRelative}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>{formatDateStrToISTDateTimeStr(data!.updatedAt!)}</span>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </p>
          </div>
          <button
            onClick={close}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground -mt-1 -mr-1 cursor-pointer rounded-md p-1.5 transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ---- Body (scrollable) ---- */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isLoading || !data ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center">
              <LoaderCircle className="size-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Customer strip */}
              <button
                type="button"
                onClick={handleCustomerOpen}
                disabled={!data.customerId}
                className={cn(
                  "bg-card border-border hover:bg-accent rounded-xl border px-4 py-3 text-left transition-colors",
                  "flex w-full items-center gap-3",
                  !data.customerId && "cursor-default"
                )}
              >
                <div className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-base font-semibold">
                  {data.customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground truncate font-semibold">
                      {data.customer.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 px-2 py-0.5 text-xs font-medium capitalize",
                        customerTypeBadgeClass[data.customer.customerType] ??
                          customerTypeBadgeClass.cash
                      )}
                    >
                      {data.customer.customerType}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                    {data.customer.contact && (
                      <span className="tabular-nums">{data.customer.contact}</span>
                    )}
                    {data.customer.address && (
                      <span className="truncate">{data.customer.address}</span>
                    )}
                    {customerOutstanding !== 0 && (
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          customerOutstanding > 0 ? "text-destructive" : "text-success"
                        )}
                      >
                        {customerOutstanding > 0 ? "Due" : "Advance"}{" "}
                        {formatRupee(Math.abs(customerOutstanding))}
                      </span>
                    )}
                  </div>
                </div>
                {data.customerId && (
                  <ArrowUpRight className="text-muted-foreground size-4 shrink-0" />
                )}
              </button>

              {/* Summary metrics */}
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                  <Metric
                    label="Grand Total"
                    value={data.grandTotal != null ? formatRupee(data.grandTotal) : "—"}
                    emphasize
                  />
                  <Metric label="Total Qty" value={String(totalQty)} />
                  <Metric label="Items" value={String(itemsCount)} />
                </div>
              </div>

              {/* Items table */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-foreground text-base font-semibold tracking-[-0.02em]">
                      Items
                    </h3>
                    <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium tabular-nums">
                      {totalCheckedQty}/{totalQty} checked
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() =>
                        batchUpdateQtyMutation.mutate({
                          type,
                          id,
                          action: BATCH_CHECK_ACTION.MARK_ALL
                        })
                      }
                      disabled={!canModify || batchUpdateQtyMutation.isPending}
                    >
                      <CheckCheck className="mr-1 size-4" />
                      Check All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() =>
                        batchUpdateQtyMutation.mutate({
                          type,
                          id,
                          action: BATCH_CHECK_ACTION.UNMARK_ALL
                        })
                      }
                      disabled={!canModify || batchUpdateQtyMutation.isPending}
                    >
                      <X className="mr-1 size-4" />
                      Uncheck All
                    </Button>
                  </div>
                </div>

                <div className="border-border overflow-x-auto rounded-xl border">
                  <table className="w-full tabular-nums">
                    <thead>
                      <tr className="bg-muted border-border border-b">
                        <th className="text-foreground px-3 py-2 text-left text-sm font-semibold">
                          #
                        </th>
                        <th className="text-foreground px-3 py-2 text-left text-sm font-semibold">
                          Product
                        </th>
                        <th className="text-foreground px-3 py-2 text-center text-sm font-semibold">
                          Qty
                        </th>
                        <th className="text-foreground px-3 py-2 text-right text-sm font-semibold">
                          Price
                        </th>
                        <th className="text-foreground px-3 py-2 text-right text-sm font-semibold">
                          Total
                        </th>
                        <th className="text-foreground w-8 px-3 py-2 text-center text-sm font-semibold"></th>
                        <th className="text-foreground px-3 py-2 text-center text-sm font-semibold">
                          Checked
                        </th>
                        <th className="text-foreground w-12 px-3 py-2 text-center text-sm font-semibold"></th>
                        <th className="text-foreground w-12 px-3 py-2 text-center text-sm font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <ItemRow
                          key={item.id}
                          canModify={canModify}
                          id={id}
                          item={item}
                          index={index + 1}
                          type={type}
                          updateQtyMutation={updateQtyMutation}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.notes && (
                  <div className="bg-muted/50 border-border mt-3 rounded-lg border px-4 py-3">
                    <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                      Notes
                    </p>
                    <p className="text-foreground text-sm">{data.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="border-border bg-card flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-sm">Subtotal</span>
              <span className="text-foreground text-sm font-semibold tabular-nums">{subtotal}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-base font-medium">Total</span>
              <span className="text-foreground text-2xl font-semibold tracking-[-0.02em] tabular-nums">
                {grandTotal}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={close}>
              Close
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleExportPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <FileDown className="mr-1 size-4" />
              )}
              {pdfLoading ? "Exporting…" : "PDF"}
            </Button>

            <Button
              size="sm"
              className="hover:bg-primary-hover cursor-pointer"
              onClick={handleEdit}
              hidden={!canModify}
            >
              <Edit className="mr-1 size-4" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={onDuplicate}
                  disabled={duplicateMutation.isPending}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 size-4" />
                  <span className="text-sm">Duplicate</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={() => setActiveDialog("convert")}
                  hidden={isSales}
                  className="cursor-pointer"
                >
                  <RefreshCcw className="mr-2 size-4" />
                  <span className="text-sm">{convertLabel}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => setActiveDialog("delete")}
                  hidden={!canModify}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 size-4" />
                  <span className="text-sm">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ---- Confirm dialogs ---- */}
        <AlertDialog
          open={activeDialog === "delete"}
          onOpenChange={(isOpen) => !isOpen && setActiveDialog("idle")}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this {isSales ? "sale" : "estimate"}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="text-foreground font-medium">#{data?.transactionNo ?? ""}</span>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                onClick={onDelete}
                disabled={deleteMutation.isPending}
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
              <AlertDialogTitle>{convertLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new sale from{" "}
                <span className="text-foreground font-medium">#{data?.transactionNo ?? ""}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
                onClick={onConvert}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending ? "Converting…" : convertLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

function Metric({
  label,
  value,
  tone = "default",
  emphasize = false
}: {
  label: string;
  value: string;
  tone?: "default" | "destructive" | "success";
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={cn(
          "truncate font-semibold tabular-nums",
          emphasize ? "text-base" : "text-sm",
          tone === "destructive" && "text-destructive",
          tone === "success" && "text-success",
          tone === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
