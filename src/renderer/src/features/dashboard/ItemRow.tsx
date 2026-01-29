import { Button } from "@/components/ui/button";
import type { MutationVariables } from "@/hooks/dashboard/useViewModal";
import {
  UPDATE_QTY_ACTION,
  type ApiResponse,
  type DashboardType,
  type EstimateItem,
  type SaleItem,
  type UpdateQtyAction
} from "@shared/types";
import type { UseMutationResult } from "@tanstack/react-query";
import { Check, Minus, Plus } from "lucide-react";
import { useCallback } from "react";

export const ItemRow = ({
  item,
  index,
  type,
  updateQtyMutation
}: {
  item: SaleItem | EstimateItem;
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
        id: item.id,
        action: action
      });
    },
    [updateQtyMutation, item.id, type]
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
        <td className="text-foreground px-3 py-2 text-center">{item.quantity}</td>
        <td className="text-foreground px-3 py-2 text-right">₹{item.price}</td>
        <td className="text-foreground px-3 py-2 text-right font-medium">₹{item.totalPrice}</td>
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
          {item.checkedQty}/{item.quantity}
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
