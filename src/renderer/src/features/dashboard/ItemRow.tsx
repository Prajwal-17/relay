import { Button } from "@/components/ui/button";
import type { MutationVariables } from "@/hooks/dashboard/useViewModal";
import {
  UPDATE_QTY_ACTION,
  type ApiResponse,
  type DashboardType,
  type UnifiedTransactionItem,
  type UpdateQtyAction
} from "@shared/types";
import { formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import { Check, Minus, Plus } from "lucide-react";
import { useCallback } from "react";

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
  updateQtyMutation: UseMutationResult<ApiResponse<string>, Error, MutationVariables>;
}) => {
  const checked = item.quantity === item.checkedQty;

  let bgColor = "bg-background";

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

  if (item.checkedQty === item.quantity) {
    bgColor = "bg-success/15";
  } else if (item.checkedQty > 0 && item.checkedQty < item.quantity) {
    bgColor = "bg-[oklch(0.8618_0.2317_65.9)]/20";
  }
  return (
    <>
      <tr
        className={`${bgColor} border-border hover:bg-opacity-50 border-b text-lg transition-colors`}
      >
        <td className="text-foreground px-3 py-3 text-center font-medium">{index}</td>
        <td
          className={`text-foreground w-sm truncate px-3 py-2 text-left font-semibold ${item.quantity === item.checkedQty ? "line-through" : ""} `}
        >
          {item.name}
        </td>
        <td className="text-foreground px-3 py-2 text-center">{fromMilliUnits(item.quantity)}</td>
        <td className="text-foreground px-3 py-2 text-right">{formatToRupees(item.price)}</td>
        <td className="text-foreground px-3 py-2 text-right font-medium">
          {formatToRupees(item.totalPrice)}
        </td>
        <td className="px-3 py-2 text-center">
          <button
            onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.SET)}
            className={`mx-auto flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-all ${
              checked
                ? "bg-success border-success"
                : "border-muted-foreground hover:border-foreground"
            }`}
          >
            {checked && <Check className="text-background" />}
          </button>
        </td>

        <td className="text-foreground px-2 py-2 text-center font-semibold">
          {fromMilliUnits(item.checkedQty)}/ {fromMilliUnits(item.quantity)}
        </td>

        <td className="px-3 py-2 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.INCREMENT)}
            disabled={checked}
            className="flex h-7 w-7 cursor-pointer items-center justify-center bg-transparent p-0"
          >
            <Plus className="size-5" />
          </Button>
        </td>

        <td className="px-3 py-2 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateQty(UPDATE_QTY_ACTION.DECREMENT)}
            disabled={item.checkedQty === 0}
            className="flex h-7 w-7 cursor-pointer items-center justify-center bg-transparent p-0"
          >
            <Minus className="size-5" />
          </Button>
        </td>
      </tr>
    </>
  );
};
