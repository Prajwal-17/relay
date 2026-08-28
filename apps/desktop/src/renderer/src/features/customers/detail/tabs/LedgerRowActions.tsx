import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LEDGER_ENTRY_TYPE, type LedgerEntry } from "@shared/types";
import { isWithinTwoDays } from "@shared/utils/dateUtils";
import { LockKeyhole, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { getLedgerEntryAccessibleName } from "./ledgerPresentation";

export type LedgerRowActionsProps = {
  entry: LedgerEntry;
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (entry: LedgerEntry) => void;
};

export function LedgerRowActions({ entry, onEdit, onDelete }: LedgerRowActionsProps) {
  const canModify = entry.type !== LEDGER_ENTRY_TYPE.SALE && isWithinTwoDays(entry.createdAt);
  const entryName = getLedgerEntryAccessibleName(entry);
  const hasActions = canModify;

  if (!hasActions) {
    const tooltipText =
      entry.type === LEDGER_ENTRY_TYPE.SALE
        ? "Edit this sale from its invoice."
        : "This entry is locked after 48 hours.";

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            tabIndex={0}
            aria-label={tooltipText}
            className="text-muted-foreground focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-(--radius-control) outline-none focus-visible:ring-2"
          >
            <LockKeyhole className="size-3.5" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={6}>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${entryName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        onClick={(event) => event.stopPropagation()}
      >
        {canModify && (
          <>
            <DropdownMenuItem
              onSelect={(event) => {
                event.stopPropagation();
                onEdit(entry);
              }}
            >
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.stopPropagation();
                onDelete(entry);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
