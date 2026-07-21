import { Button } from "@/components/ui/button";
import type { MutationVariables } from "@/hooks/dashboard/useViewModal";
import {
  UPDATE_QTY_ACTION,
  type DashboardType,
  type UnifiedTransactionItem,
  type UpdateQtyAction
} from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import type { UseMutationResult } from "@tanstack/react-query";
import { Check, Minus, Plus } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

export const ItemRow = ({
  id,
  item,
  index,
  type,
  updateQtyMutation
}: {
  id: string;
  item: UnifiedTransactionItem;
  index: number;
  type: DashboardType;
  updateQtyMutation: UseMutationResult<null, Error, MutationVariables>;
}) => {
  const checked = item.quantity > 0 && item.checkedQty === item.quantity;
  const partial = item.checkedQty > 0 && item.checkedQty < item.quantity;

  const handleUpdateQty = useCallback(
    (action: UpdateQtyAction) => {
      updateQtyMutation.mutate({
        type: type,
        id: id,
        itemId: item.id,
        action: action
      });
    },
    [updateQtyMutation, item.id, type, id]
  );

  return (
    <tr
      className={cn(
        "border-border/70 hover:bg-accent/40 border-b text-sm transition-colors",
        checked && "bg-success/10 hover:bg-success/15",
        partial && "bg-warning/10 hover:bg-warning/15",
        !checked && !partial && "bg-card"
      )}
    >
      <td className="text-muted-foreground px-3 py-2.5 text-center font-medium tabular-nums">
        {index}
      </td>
      <td
        className={cn(
          "text-foreground max-w-sm truncate px-3 py-2.5 text-left font-medium",
          checked && "line-through opacity-70"
        )}
      >
        {item.productSnapshot}
      </td>
      <td className="text-foreground px-3 py-2.5 text-center tabular-nums">
        {fromMilliUnits(item.quantity)}
      </td>
      <td className="text-foreground px-3 py-2.5 text-right tabular-nums">
        {formatRupee(item.price)}
      </td>
      <td className="text-foreground px-3 py-2.5 text-right font-semibold tabular-nums">
        {formatRupee(item.totalPrice)}
      </td>
      <td className="px-3 py-2.5 text-center">
        <button
          type="button"
          onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.SET)}
          aria-label={checked ? "Uncheck item" : "Check item"}
          className={cn(
            "mx-auto flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
            checked
              ? "bg-success text-background border-success"
              : "bg-muted/70 text-muted-foreground border-border hover:border-input"
          )}
        >
          {checked && <Check className="size-4" />}
        </button>
      </td>
      <td className="text-foreground px-2 py-2.5 text-center font-semibold tabular-nums">
        <span className={cn(checked && "text-success", partial && "text-warning")}>
          {fromMilliUnits(item.checkedQty)}
        </span>
        <span className="text-muted-foreground/60"> / {fromMilliUnits(item.quantity)}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.INCREMENT)}
          disabled={checked}
          aria-label="Increment checked quantity"
          className="flex size-7 cursor-pointer items-center justify-center bg-transparent p-0"
        >
          <Plus className="size-4" />
        </Button>
      </td>
      <td className="px-3 py-2.5 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.DECREMENT)}
          disabled={item.checkedQty === 0}
          aria-label="Decrement checked quantity"
          className="flex size-7 cursor-pointer items-center justify-center bg-transparent p-0"
        >
          <Minus className="size-4" />
        </Button>
      </td>
    </tr>
  );
};
