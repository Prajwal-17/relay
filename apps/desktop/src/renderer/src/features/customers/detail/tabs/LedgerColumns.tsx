import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TXN_TABLE_ALIGN, type TxnTableColMeta } from "@/types";
import { LEDGER_ENTRY_TYPE, type LedgerEntry, type LedgerEntryType } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { ColumnDef } from "@tanstack/react-table";

const typePillClass: Record<LedgerEntryType, string> = {
  [LEDGER_ENTRY_TYPE.SALE]: "border-info/25 bg-info/15 text-info",
  [LEDGER_ENTRY_TYPE.QUICK_SALE]: "border-primary/25 bg-primary/15 text-primary",
  [LEDGER_ENTRY_TYPE.PAYMENT]: "border-success/25 bg-success/15 text-success",
  [LEDGER_ENTRY_TYPE.ADJUSTMENT]: "border-warning/30 bg-warning/15 text-warning",
  [LEDGER_ENTRY_TYPE.OPENING_BALANCE]: "bg-secondary text-muted-foreground border-border"
};

const typeLabel: Record<LedgerEntryType, string> = {
  [LEDGER_ENTRY_TYPE.SALE]: "Sale",
  [LEDGER_ENTRY_TYPE.QUICK_SALE]: "Quick Sale",
  [LEDGER_ENTRY_TYPE.PAYMENT]: "Payment",
  [LEDGER_ENTRY_TYPE.ADJUSTMENT]: "Adjustment",
  [LEDGER_ENTRY_TYPE.OPENING_BALANCE]: "Opening"
};

type LedgerColumnsOptions = {
  onOpenSale?: (saleId: string) => void;
};

export function buildLedgerColumns(opts: LedgerColumnsOptions = {}): ColumnDef<LedgerEntry>[] {
  const { onOpenSale } = opts;

  return [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        const { fullDate, timePart } = createdAt
          ? formatDateStrToISTDateStr(createdAt)
          : { fullDate: "—", timePart: "" };
        return (
          <div className="flex flex-col">
            <span className="text-foreground whitespace-nowrap text-sm font-semibold tabular-nums">
              {fullDate}
            </span>
            {timePart && (
              <span className="text-muted-foreground whitespace-nowrap text-xs font-medium tabular-nums">
                {timePart}
              </span>
            )}
          </div>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.LEFT, width: "w-[145px]" } as TxnTableColMeta
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge
            variant="outline"
            className={cn("px-2 py-0.5 text-xs font-medium capitalize", typePillClass[type])}
          >
            {typeLabel[type]}
          </Badge>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.LEFT, width: "w-[110px]" } as TxnTableColMeta
    },
    {
      id: "ref",
      header: "Ref",
      cell: ({ row }) => {
        const entry = row.original;
        if (entry.saleId) {
          if (onOpenSale) {
            return (
              <button
                type="button"
                onClick={() => onOpenSale(entry.saleId!)}
                className="text-primary hover:text-primary-hover cursor-pointer text-sm font-semibold tabular-nums"
              >
                INV #{entry.invoiceNo ?? "—"}
              </button>
            );
          }
          return (
            <span className="text-primary text-sm font-semibold tabular-nums">
              INV #{entry.invoiceNo ?? "—"}
            </span>
          );
        }
        return <span className="text-muted-foreground/60 text-sm">—</span>;
      },
      meta: { align: TXN_TABLE_ALIGN.LEFT, width: "w-[110px]" } as TxnTableColMeta
    },
    {
      accessorKey: "notes",
      header: "Description",
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <span
            className={cn(
              "truncate text-sm font-medium",
              notes ? "text-foreground" : "text-muted-foreground/60"
            )}
          >
            {notes || "—"}
          </span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.LEFT } as TxnTableColMeta
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => {
        const debit = row.original.debit;
        return debit > 0 ? (
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {formatRupee(debit)}
          </span>
        ) : (
          <span className="text-muted-foreground/60 text-sm">—</span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[110px]" } as TxnTableColMeta
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => {
        const credit = row.original.credit;
        return credit > 0 ? (
          <span className="text-success text-sm font-semibold tabular-nums">
            {formatRupee(credit)}
          </span>
        ) : (
          <span className="text-muted-foreground/60 text-sm">—</span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[110px]" } as TxnTableColMeta
    },
    {
      accessorKey: "runningBalance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = row.original.runningBalance;
        const isDebit = balance >= 0;
        return (
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              balance === 0
                ? "text-muted-foreground"
                : isDebit
                  ? "text-destructive"
                  : "text-success"
            )}
          >
            {formatRupee(Math.abs(balance))}
          </span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[120px]" } as TxnTableColMeta
    }
  ];
}
