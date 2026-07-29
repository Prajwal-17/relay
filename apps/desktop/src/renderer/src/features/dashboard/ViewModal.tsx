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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useViewModal } from "@/hooks/dashboard/useViewModal";
import { cn } from "@/lib/utils";
import { useViewModalStore } from "@/store/viewModalStore";
import { BATCH_CHECK_ACTION, type DashboardType } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import { formatRupee } from "@shared/utils/utils";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCheck,
  ChevronDown,
  Copy,
  Edit,
  FileDown,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  StickyNote,
  Trash2,
  X
} from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ItemRow } from "./ItemRow";

const customerTypeBadgeClass: Record<string, string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/10 text-info border-info",
  hotel: "bg-primary/10 text-primary border-primary"
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

type TransactionActionsProps = {
  variant: "rail" | "footer";
  isSales: boolean;
  canModify: boolean;
  pdfLoading: boolean;
  isDuplicating: boolean;
  onEdit: () => void;
  onExportPdf: () => void;
  onDuplicate: () => void;
  onConvertRequest: () => void;
  onDeleteRequest: () => void;
};

function TransactionActions({
  variant,
  isSales,
  canModify,
  pdfLoading,
  isDuplicating,
  onEdit,
  onExportPdf,
  onDuplicate,
  onConvertRequest,
  onDeleteRequest
}: TransactionActionsProps) {
  const isRail = variant === "rail";

  return (
    <div
      className={cn(
        isRail ? "flex flex-col gap-2" : "grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-2"
      )}
    >
      {canModify ? (
        <Button className={cn("hover:bg-primary-hover", isRail && "w-full")} onClick={onEdit}>
          <Edit className="size-4" />
          Edit
        </Button>
      ) : (
        <div
          className={cn(
            "border-border bg-muted text-muted-foreground flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium",
            isRail && "w-full"
          )}
        >
          <LockKeyhole className="size-4" />
          Editing locked
        </div>
      )}

      <Button
        variant="outline"
        className={cn(isRail && "w-full")}
        onClick={onExportPdf}
        disabled={pdfLoading}
      >
        {pdfLoading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
        {pdfLoading ? "Exporting…" : "Export PDF"}
      </Button>

      {!isSales && (
        <Button variant="outline" className={cn(isRail && "w-full")} onClick={onConvertRequest}>
          <RefreshCcw className="size-4" />
          Convert to Sale
        </Button>
      )}

      <Button
        variant="outline"
        className={cn(isRail && "w-full")}
        onClick={onDuplicate}
        disabled={isDuplicating}
      >
        {isDuplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
        {isDuplicating ? "Duplicating…" : "Duplicate"}
      </Button>

      {canModify && (
        <div className={cn(isRail ? "border-border mt-1 border-t pt-2" : "contents")}>
          <Button
            variant="ghost"
            className={cn(
              "text-destructive hover:bg-destructive/10 hover:text-destructive",
              isRail && "w-full"
            )}
            onClick={onDeleteRequest}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export const ViewModal = ({ type, id }: { type: DashboardType; id: string }) => {
  const navigate = useNavigate();
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);

  const {
    data,
    isLoading,
    isError,
    error,
    retry,
    isRetrying,
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
  const [notesExpanded, setNotesExpanded] = useState(false);

  const close = useCallback(() => setIsViewModalOpen(false), [setIsViewModalOpen]);

  const isSales = type === "sales";
  const canModify = !isSales || data?.canModify !== false;
  const transactionLabel = isSales ? "Sale" : "Estimate";

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
    deleteMutation.mutate({ type, id }, { onSuccess: close });
  }, [deleteMutation, type, id, close]);

  const onConvert = useCallback(() => {
    convertMutation.mutate({ type, id }, { onSuccess: close });
  }, [convertMutation, type, id, close]);

  const onDuplicate = useCallback(() => {
    duplicateMutation.mutate({ type, id });
  }, [duplicateMutation, type, id]);

  const handleExportPdf = useCallback(async () => {
    const filePath = await exportPdf();
    if (!filePath) return;
    toast.success(
      (toastInstance) => (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">PDF saved successfully</span>
          <button
            onClick={() => {
              window.exportApi.showItemInFolder(filePath);
              toast.dismiss(toastInstance.id);
            }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-sm font-medium transition-colors hover:underline"
          >
            Open
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      ),
      { duration: 4000 }
    );
  }, [exportPdf]);

  const createdAt = data?.createdAt ?? data?.recordedAt;
  const createdAbsolute = createdAt ? formatDateStrToISTDateTimeStr(createdAt) : null;
  const updatedRelative = formatRelativeTime(data?.updatedAt);
  const isModified = Boolean(
    data?.updatedAt &&
    createdAt &&
    new Date(data.updatedAt).getTime() !== new Date(createdAt).getTime()
  );
  const customerOutstanding = data?.customer.outstandingBalance ?? 0;
  const subtotal = data
    ? formatRupee(data.items.reduce((sum, item) => sum + item.totalPrice, 0))
    : "—";
  const grandTotal = data?.grandTotal == null ? "—" : formatRupee(data.grandTotal);
  const formattedTotalQty = String(fromMilliUnits(totalQty));
  const formattedCheckedQty = String(fromMilliUnits(totalCheckedQty));
  const isBatchPending = batchUpdateQtyMutation.isPending;
  const isMarkingAll =
    isBatchPending && batchUpdateQtyMutation.variables?.action === BATCH_CHECK_ACTION.MARK_ALL;
  const isClearingAll =
    isBatchPending && batchUpdateQtyMutation.variables?.action === BATCH_CHECK_ACTION.UNMARK_ALL;

  const sharedActions = {
    isSales,
    canModify,
    pdfLoading,
    isDuplicating: duplicateMutation.isPending,
    onEdit: handleEdit,
    onExportPdf: handleExportPdf,
    onDuplicate,
    onConvertRequest: () => setActiveDialog("convert"),
    onDeleteRequest: () => setActiveDialog("delete")
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="bg-card border-frame flex h-[min(680px,calc(100vh-16px))] w-[calc(100vw-16px)] max-w-[1120px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1120px]"
      >
        <header className="border-border bg-card flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                  isSales
                    ? "bg-success/10 text-success border-success"
                    : "bg-info/10 text-info border-info"
                )}
              >
                {transactionLabel}
              </Badge>
              <DialogTitle className="text-foreground min-w-0 flex-1 truncate text-lg font-semibold tracking-[-0.02em]">
                {isSales ? "Invoice" : "Estimate"} #{data?.transactionNo ?? "—"}
              </DialogTitle>
              {!canModify && data && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="border-border bg-muted text-muted-foreground shrink-0 gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                      <LockKeyhole className="size-3" />
                      Locked after 48h
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72">
                    Editing and item checks are unavailable. Export and duplication remain
                    available.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs tabular-nums">
              {createdAbsolute ? (
                <span>Created {createdAbsolute}</span>
              ) : (
                <span>Transaction details</span>
              )}
              {isModified && updatedRelative && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default underline-offset-2 hover:underline">
                      Updated {updatedRelative}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{formatDateStrToISTDateTimeStr(data!.updatedAt!)}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close transaction">
            <X className="size-4" />
          </Button>
        </header>

        {isLoading || (!data && !isError) ? (
          <InvoiceSkeleton />
        ) : isError || !data ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="border-border bg-card w-full max-w-sm rounded-lg border p-5 text-center">
              <AlertCircle className="text-destructive mx-auto size-8" />
              <h3 className="text-foreground mt-3 font-semibold">Couldn’t load this transaction</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {error?.message || "The transaction details are unavailable."}
              </p>
              <Button className="mt-4" onClick={() => retry()} disabled={isRetrying}>
                {isRetrying && <Loader2 className="size-4 animate-spin" />}
                {isRetrying ? "Retrying…" : "Retry"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 min-[900px]:grid-cols-[minmax(0,1fr)_236px]">
              <main className="flex min-h-0 min-w-0 flex-col gap-3">
                <button
                  type="button"
                  onClick={handleCustomerOpen}
                  disabled={!data.customerId}
                  className={cn(
                    "border-border bg-card flex min-h-[56px] w-full shrink-0 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    data.customerId
                      ? "hover:bg-accent cursor-pointer"
                      : "cursor-default disabled:opacity-100"
                  )}
                >
                  <div className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
                    {data.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="text-foreground truncate font-semibold"
                        title={data.customer.name}
                      >
                        {data.customer.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0 text-xs font-medium capitalize",
                          customerTypeBadgeClass[data.customer.customerType] ??
                            customerTypeBadgeClass.cash
                        )}
                      >
                        {data.customer.customerType}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-2 text-xs">
                      {data.customer.contact || data.customer.address ? (
                        <>
                          {data.customer.contact && (
                            <span className="shrink-0 tabular-nums">{data.customer.contact}</span>
                          )}
                          {data.customer.address && (
                            <span className="truncate" title={data.customer.address}>
                              {data.customer.address}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>No contact details</span>
                      )}
                    </div>
                  </div>
                  {customerOutstanding !== 0 && (
                    <span
                      className={cn(
                        "shrink-0 text-right tabular-nums",
                        customerOutstanding > 0 ? "text-destructive" : "text-success"
                      )}
                    >
                      <span className="block text-xs font-medium">
                        {customerOutstanding > 0 ? "Due" : "Advance"}
                      </span>
                      <span className="block text-sm font-bold">
                        {formatRupee(Math.abs(customerOutstanding))}
                      </span>
                    </span>
                  )}
                  {data.customerId && (
                    <ArrowUpRight className="text-muted-foreground size-4 shrink-0" />
                  )}
                </button>

                <div className="min-[900px]:hidden">
                  <CompactSummary
                    subtotal={subtotal}
                    grandTotal={grandTotal}
                    itemsCount={itemsCount}
                    totalQty={formattedTotalQty}
                    checkedProgress={`${formattedCheckedQty} / ${formattedTotalQty}`}
                  />
                </div>

                <section
                  aria-labelledby="transaction-items-heading"
                  className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border"
                >
                  <div className="border-border bg-card flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 id="transaction-items-heading" className="text-foreground font-semibold">
                        Items
                      </h3>
                      <span className="text-muted-foreground truncate text-xs tabular-nums">
                        {itemsCount} {itemsCount === 1 ? "item" : "items"} · {formattedCheckedQty} /{" "}
                        {formattedTotalQty} checked
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {data.notes && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-[900px]:hidden"
                              aria-label="View transaction notes"
                            >
                              <StickyNote className="size-4" />
                              <span className="max-[640px]:sr-only">Notes</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-80 p-3">
                            <p className="text-foreground text-sm font-semibold">Notes</p>
                            <p className="text-muted-foreground mt-2 max-h-48 overflow-y-auto text-sm leading-5 whitespace-pre-wrap">
                              {data.notes}
                            </p>
                          </PopoverContent>
                        </Popover>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          batchUpdateQtyMutation.mutate({
                            type,
                            id,
                            action: BATCH_CHECK_ACTION.MARK_ALL
                          })
                        }
                        disabled={!canModify || itemsCount === 0 || isBatchPending}
                      >
                        {isMarkingAll ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCheck className="size-4" />
                        )}
                        {isMarkingAll ? "Checking…" : "Check all"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          batchUpdateQtyMutation.mutate({
                            type,
                            id,
                            action: BATCH_CHECK_ACTION.UNMARK_ALL
                          })
                        }
                        disabled={!canModify || totalCheckedQty === 0 || isBatchPending}
                      >
                        {isClearingAll ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <X className="size-4" />
                        )}
                        {isClearingAll ? "Clearing…" : "Uncheck all"}
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[690px] table-fixed tabular-nums">
                      <colgroup>
                        <col className="w-10" />
                        <col />
                        <col className="w-16" />
                        <col className="w-24" />
                        <col className="w-28" />
                        <col className="w-[214px]" />
                      </colgroup>
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr className="border-border border-b">
                          <th className="text-muted-foreground px-2 py-2 text-center text-xs font-semibold">
                            #
                          </th>
                          <th className="text-muted-foreground px-2.5 py-2 text-left text-xs font-semibold">
                            Product
                          </th>
                          <th className="text-muted-foreground px-2 py-2 text-center text-xs font-semibold">
                            Qty
                          </th>
                          <th className="text-muted-foreground px-2.5 py-2 text-right text-xs font-semibold">
                            Price
                          </th>
                          <th className="text-muted-foreground px-2.5 py-2 text-right text-xs font-semibold">
                            Total
                          </th>
                          <th className="text-muted-foreground px-2.5 py-2 text-right text-xs font-semibold">
                            Checked
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.length > 0 ? (
                          data.items.map((item, index) => (
                            <ItemRow
                              key={item.id}
                              canModify={canModify}
                              id={id}
                              item={item}
                              index={index + 1}
                              type={type}
                              updateQtyMutation={updateQtyMutation}
                            />
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-muted-foreground h-28 text-center text-sm"
                            >
                              No items were added to this transaction.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </main>

              <aside
                aria-label="Bill summary and transaction actions"
                className="border-border bg-card hidden min-h-0 flex-col rounded-lg border p-3 min-[900px]:flex"
              >
                <h3 className="text-foreground font-semibold">Bill summary</h3>
                <dl className="mt-3 space-y-2.5">
                  <SummaryRow label="Items" value={String(itemsCount)} />
                  <SummaryRow label="Total quantity" value={formattedTotalQty} />
                  <SummaryRow
                    label="Checked"
                    value={`${formattedCheckedQty} / ${formattedTotalQty}`}
                  />
                </dl>

                <div className="border-border my-4 border-y py-4">
                  <SummaryRow label="Subtotal" value={subtotal} />
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-muted-foreground text-sm font-semibold">Grand Total</p>
                    <p className="text-foreground text-right text-2xl leading-tight font-bold tracking-[-0.02em] tabular-nums">
                      {grandTotal}
                    </p>
                  </div>
                </div>

                {data.notes && (
                  <section className="border-border mb-4 border-b pb-4">
                    <button
                      type="button"
                      aria-expanded={notesExpanded}
                      aria-controls="transaction-notes-summary"
                      onClick={() => setNotesExpanded((expanded) => !expanded)}
                      className="hover:bg-muted focus-visible:ring-ring flex h-8 w-full items-center justify-between rounded-(--radius-control) px-2 text-left focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                        <StickyNote className="text-muted-foreground size-4" />
                        Notes
                      </span>
                      <ChevronDown
                        className={cn(
                          "text-muted-foreground size-4",
                          notesExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {notesExpanded && (
                      <p
                        id="transaction-notes-summary"
                        className="text-muted-foreground mt-2 max-h-28 overflow-y-auto px-2 text-sm leading-5 whitespace-pre-wrap"
                      >
                        {data.notes}
                      </p>
                    )}
                  </section>
                )}

                <div className="mt-auto">
                  <TransactionActions variant="rail" {...sharedActions} />
                </div>
              </aside>
            </div>

            <footer className="border-border bg-card shrink-0 border-t p-2 min-[900px]:hidden">
              <TransactionActions variant="footer" {...sharedActions} />
            </footer>
          </>
        )}

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
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  onDelete();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
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
              <AlertDialogTitle>Convert to Sale?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new sale from{" "}
                <span className="text-foreground font-medium">#{data?.transactionNo ?? ""}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={convertMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  onConvert();
                }}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {convertMutation.isPending ? "Converting…" : "Convert to Sale"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground text-right text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function CompactSummary({
  subtotal,
  grandTotal,
  itemsCount,
  totalQty,
  checkedProgress
}: {
  subtotal: string;
  grandTotal: string;
  itemsCount: number;
  totalQty: string;
  checkedProgress: string;
}) {
  return (
    <section
      aria-label="Bill summary"
      className="border-border bg-muted rounded-lg border px-3 py-2"
    >
      <dl className="grid grid-cols-2 items-end gap-3 min-[680px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(64px,0.5fr)_minmax(74px,0.6fr)_minmax(112px,0.9fr)]">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs">Subtotal</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{subtotal}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs font-semibold">Grand Total</dt>
          <dd className="text-foreground mt-0.5 text-lg leading-tight font-bold tracking-[-0.02em] tabular-nums">
            {grandTotal}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Items</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{itemsCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Qty</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{totalQty}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Checked</dt>
          <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{checkedProgress}</dd>
        </div>
      </dl>
    </section>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 animate-pulse grid-cols-1 gap-3 p-3 min-[900px]:grid-cols-[minmax(0,1fr)_236px]">
      <div className="flex min-h-0 flex-col gap-3">
        <div className="bg-muted h-14 shrink-0 rounded-lg" />
        <div className="border-border min-h-0 flex-1 rounded-lg border">
          <div className="bg-muted h-12 border-b" />
          <div className="space-y-px p-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="bg-muted h-10 rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="border-border hidden rounded-lg border p-3 min-[900px]:block">
        <div className="bg-muted h-5 w-24 rounded" />
        <div className="bg-muted mt-4 h-24 rounded-md" />
        <div className="bg-muted mt-4 h-16 rounded-md" />
        <div className="mt-6 space-y-2">
          <div className="bg-muted h-9 rounded-md" />
          <div className="bg-muted h-9 rounded-md" />
          <div className="bg-muted h-9 rounded-md" />
        </div>
      </div>
      <span className="sr-only">Loading transaction…</span>
    </div>
  );
}
