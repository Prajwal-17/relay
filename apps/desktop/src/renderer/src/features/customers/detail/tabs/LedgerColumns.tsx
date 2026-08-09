import { cn } from "@/lib/utils";
import { TXN_TABLE_ALIGN, type TxnTableColMeta } from "@/types/renderer.types";
import { LEDGER_ENTRY_TYPE, type LedgerEntry } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { IndianRupee, Receipt, Scale, Wallet, Zap, type LucideIcon } from "lucide-react";
import { LedgerRowActions } from "./LedgerRowActions";
import {
  formatSignedMovement,
  getBalanceStateLabel,
  getLedgerMovement,
  getLedgerParticulars
} from "./ledgerPresentation";

type EntryMarker = {
  icon: LucideIcon;
  className: string;
};

const ENTRY_MARKER: Record<LedgerEntry["type"], EntryMarker> = {
  [LEDGER_ENTRY_TYPE.SALE]: {
    icon: Receipt,
    className: "border-sales/30 bg-sales-soft text-sales-foreground"
  },
  [LEDGER_ENTRY_TYPE.QUICK_SALE]: {
    icon: Zap,
    className: "border-counter-accent/30 bg-counter-accent-soft text-counter-accent-foreground"
  },
  [LEDGER_ENTRY_TYPE.PAYMENT]: {
    icon: IndianRupee,
    className: "border-success bg-success text-success-foreground"
  },
  [LEDGER_ENTRY_TYPE.ADJUSTMENT]: {
    icon: Scale,
    className: "border-gold-accent-border bg-gold-accent-soft text-gold-accent-foreground"
  },
  [LEDGER_ENTRY_TYPE.OPENING_BALANCE]: {
    icon: Wallet,
    className: "border-olive-accent/40 bg-olive-accent-soft text-olive-accent-foreground"
  }
};

export type LedgerColumnsOptions = {
  onOpenSale: (saleId: string) => void;
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (entry: LedgerEntry) => void;
};

export function buildLedgerColumns({
  onOpenSale,
  onEdit,
  onDelete
}: LedgerColumnsOptions): ColumnDef<LedgerEntry>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const entry = row.original;
        const { fullDate, timePart } = formatDateStrToISTDateStr(entry.createdAt);
        return (
          <time
            dateTime={entry.createdAt}
            title={`${fullDate} ${timePart}`}
            aria-label={`${fullDate}, ${timePart}`}
            className="flex flex-col gap-0.5 whitespace-nowrap tabular-nums"
          >
            <span className="text-foreground text-sm leading-4 font-semibold">{fullDate}</span>
            <span className="text-muted-foreground text-sm leading-4">{timePart}</span>
          </time>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.LEFT, width: "w-[128px]" } as TxnTableColMeta
    },
    {
      id: "particulars",
      header: "Type",
      cell: ({ row }) => {
        const entry = row.original;
        const particulars = getLedgerParticulars(entry);
        const marker = ENTRY_MARKER[entry.type];
        const EntryIcon = marker.icon;

        return (
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) border",
                marker.className
              )}
            >
              <EntryIcon className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-sm font-semibold" title={particulars.label}>
                  {particulars.label}
                </span>
                {entry.saleId && particulars.detail && (
                  <button
                    type="button"
                    title={particulars.detail}
                    aria-label={"Open " + particulars.detail}
                    className="text-primary hover:text-primary-hover focus-visible:ring-ring hover:bg-hover inline-flex h-8 min-w-0 cursor-pointer items-center rounded-(--radius-control) px-1.5 text-left text-sm font-semibold underline underline-offset-2 outline-none focus-visible:ring-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenSale(entry.saleId!);
                    }}
                  >
                    <span className="truncate">{particulars.detail}</span>
                  </button>
                )}
              </div>
              {!entry.saleId && particulars.detail && (
                <span
                  className="text-muted-foreground min-w-0 truncate text-xs"
                  title={particulars.detail}
                >
                  {particulars.detail}
                </span>
              )}
            </div>
          </div>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.LEFT } as TxnTableColMeta
    },
    {
      id: "movement",
      header: "Amount",
      cell: ({ row }) => {
        const entry = row.original;
        const movement = getLedgerMovement(entry);
        const isPayment = entry.type === LEDGER_ENTRY_TYPE.PAYMENT;
        return (
          <span
            className={cn(
              "text-base font-semibold whitespace-nowrap tabular-nums",
              isPayment
                ? "text-success"
                : movement !== 0
                  ? "text-foreground"
                  : "text-muted-foreground"
            )}
          >
            {formatSignedMovement(entry)}
          </span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[160px]" } as TxnTableColMeta
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = row.original.runningBalance;
        const balanceLabel = getBalanceStateLabel(balance);
        const formattedBalance = formatRupee(Math.abs(balance));
        const sign = balance > 0 ? "+ " : balance < 0 ? "− " : "";
        const balanceTone =
          balance > 0
            ? "text-counter-accent-foreground"
            : balance < 0
              ? "text-sales-foreground"
              : "text-muted-foreground";

        return (
          <span
            aria-label={formattedBalance + ", " + balanceLabel}
            title={balanceLabel}
            className={cn("text-base font-semibold whitespace-nowrap tabular-nums", balanceTone)}
          >
            {sign}
            {formattedBalance}
          </span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[168px]" } as TxnTableColMeta
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <LedgerRowActions
            entry={row.original}
            onOpenSale={onOpenSale}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[48px]" } as TxnTableColMeta
    }
  ];
}
