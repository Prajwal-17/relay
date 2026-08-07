import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TXN_TABLE_ALIGN, type TxnTableColMeta } from "@/types/renderer.types";
import { LEDGER_ENTRY_TYPE, type LedgerEntry, type LedgerEntryType } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { isWithinTwoDays } from "@shared/utils/dateUtils";

const typePillClass: Record<LedgerEntryType, string> = {
  [LEDGER_ENTRY_TYPE.SALE]: "border-success/25 bg-success/10 text-success",
  [LEDGER_ENTRY_TYPE.QUICK_SALE]: "border-success/25 bg-success/10 text-success",
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
  onEdit?: (entry: LedgerEntry) => void;
  onDelete?: (entry: LedgerEntry) => void;
};

export function buildLedgerColumns(opts: LedgerColumnsOptions = {}): ColumnDef<LedgerEntry>[] {
  const { onOpenSale, onEdit, onDelete } = opts;

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
            <span className="text-foreground text-sm font-semibold whitespace-nowrap tabular-nums">
              {fullDate}
            </span>
            {timePart && (
              <span className="text-muted-foreground text-xs font-medium whitespace-nowrap tabular-nums">
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
                className="text-primary hover:text-primary-hover cursor-pointer text-sm font-semibold tabular-nums hover:underline"
              >
                INV #{entry.invoiceNo ?? "—"}
              </button>
            );
          }
          return (
            <span className="text-primary text-sm font-semibold tabular-nums hover:underline">
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
      accessorKey: "amountDue",
      header: "Amount Due",
      cell: ({ row }) => {
        const amountDue = row.original.amountDue;
        return amountDue > 0 ? (
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {formatRupee(amountDue)}
          </span>
        ) : (
          <span className="text-muted-foreground/60 text-sm">—</span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[110px]" } as TxnTableColMeta
    },
    {
      accessorKey: "amountPaid",
      header: "Amount Paid",
      cell: ({ row }) => {
        const amountPaid = row.original.amountPaid;
        return amountPaid > 0 ? (
          <span className="text-success text-sm font-semibold tabular-nums">
            {formatRupee(amountPaid)}
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
        const isDue = balance >= 0;
        return (
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              balance === 0 ? "text-muted-foreground" : isDue ? "text-destructive" : "text-success"
            )}
          >
            {formatRupee(Math.abs(balance))}
          </span>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[120px]" } as TxnTableColMeta
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const entry = row.original;
        const canModify = entry.type !== LEDGER_ENTRY_TYPE.SALE && isWithinTwoDays(entry.createdAt);
        if (!canModify || (!onEdit && !onDelete)) return null;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer p-0"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(entry)}
                    className="cursor-pointer text-sm font-medium"
                  >
                    <Pencil className="mr-2 size-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(entry)}
                    className="text-destructive focus:text-destructive cursor-pointer text-sm font-medium"
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      meta: { align: TXN_TABLE_ALIGN.RIGHT, width: "w-[52px]" } as TxnTableColMeta
    }
  ];
}
