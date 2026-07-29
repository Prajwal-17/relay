import { Button } from "@/components/ui/button";
import type { MutationVariables } from "@/hooks/dashboard/useViewModal";
import { cn } from "@/lib/utils";
import {
  UPDATE_QTY_ACTION,
  type DashboardType,
  type UnifiedTransactionItem,
  type UpdateQtyAction
} from "@shared/types";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import { formatRupee } from "@shared/utils/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { useCallback } from "react";

export const ItemRow = ({
  id,
  item,
  index,
  type,
  updateQtyMutation,
  canModify
}: {
  id: string;
  item: UnifiedTransactionItem;
  index: number;
  type: DashboardType;
  updateQtyMutation: UseMutationResult<null, Error, MutationVariables>;
  canModify: boolean;
}) => {
  const checked = item.quantity > 0 && item.checkedQty === item.quantity;
  const partial = item.checkedQty > 0 && item.checkedQty < item.quantity;
  const isUpdating = updateQtyMutation.isPending && updateQtyMutation.variables?.itemId === item.id;

  const handleUpdateQty = useCallback(
    (action: UpdateQtyAction) => {
      updateQtyMutation.mutate({
        type,
        id,
        itemId: item.id,
        action
      });
    },
    [updateQtyMutation, item.id, type, id]
  );

  return (
    <tr
      className={cn(
        "border-border hover:bg-accent border-b text-sm transition-colors",
        checked && "bg-success/10 hover:bg-success/10",
        partial && "bg-warning/10 hover:bg-warning/10",
        !checked && !partial && "bg-card"
      )}
    >
      <td className="text-muted-foreground h-[42px] px-2 text-center font-medium tabular-nums">
        {index}
      </td>
      <td
        className={cn(
          "text-foreground max-w-0 truncate px-2.5 text-left font-medium",
          checked && "text-muted-foreground line-through"
        )}
        title={item.productSnapshot}
      >
        {item.productSnapshot}
      </td>
      <td className="text-foreground px-2 text-center tabular-nums">
        {fromMilliUnits(item.quantity)}
      </td>
      <td className="text-foreground px-2.5 text-right tabular-nums">{formatRupee(item.price)}</td>
      <td className="text-foreground px-2.5 text-right font-semibold tabular-nums">
        {formatRupee(item.totalPrice)}
      </td>
      <td className="px-2.5">
        <div className="ml-auto flex w-[194px] items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.SET)}
            aria-label={checked ? "Mark item unchecked" : "Mark item complete"}
            disabled={!canModify || isUpdating}
            className={cn(
              "focus-visible:ring-ring/50 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-(--radius-control) border transition-[border-color,box-shadow,background-color,color] focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              checked
                ? "border-success bg-success text-success-foreground"
                : "border-border bg-muted/70 text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            {isUpdating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              checked && <Check className="size-4" strokeWidth={3} />
            )}
          </button>

          <div
            className={cn(
              "min-w-0 flex-1 text-center text-sm font-semibold whitespace-nowrap tabular-nums",
              checked && "text-success",
              partial && "text-warning"
            )}
          >
            {fromMilliUnits(item.checkedQty)}
            <span className="text-muted-foreground/80">/{fromMilliUnits(item.quantity)}</span>
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.INCREMENT)}
            disabled={!canModify || isUpdating || checked}
            aria-label="Increase checked quantity"
            className="border-border/70 bg-muted/60 hover:bg-background size-8 cursor-pointer rounded-(--radius-control) shadow-none"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.DECREMENT)}
            disabled={!canModify || isUpdating || item.checkedQty === 0}
            aria-label="Decrease checked quantity"
            className="border-border/70 bg-muted/60 hover:bg-background size-8 cursor-pointer rounded-(--radius-control) shadow-none"
          >
            <Minus className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};
