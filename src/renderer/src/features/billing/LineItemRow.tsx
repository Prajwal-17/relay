import { Button } from "@/components/ui/button";
import { useLineItemsStore, type LineItem } from "@/store/lineItemsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { getCheckStatusColor, updateCheckedQuantity } from "@/utils";
import { UPDATE_QTY_ACTION } from "@shared/types";
import { Check, GripVertical, IndianRupee, Minus, Plus, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { MemoizedSearchDropdown } from "../search/MemoizedSearchDropDown";
import QuantityPresets from "./QuantityPresets";

const LineItemRow = memo(
  ({
    idx,
    item,
    isCountColumnVisible
  }: {
    idx: number;
    item: LineItem;
    isCountColumnVisible: boolean;
  }) => {
    const { updateLineItem, deleteLineItem } = useLineItemsStore(
      useShallow((state) => ({
        updateLineItem: state.updateLineItem,
        deleteLineItem: state.deleteLineItem
      }))
    );

    const { searchRow, setSearchRow, isDropdownOpen, setSearchParam, setIsDropdownOpen } =
      useSearchDropdownStore(
        useShallow((state) => ({
          searchRow: state.searchRow,
          setSearchRow: state.setSearchRow,
          isDropdownOpen: state.isDropdownOpen,
          setSearchParam: state.setSearchParam,
          setIsDropdownOpen: state.setIsDropdownOpen
        }))
      );

    const [qtyPresetOpen, setQtyPresetOpen] = useState<number | null>(null);
    const checked = item.quantity === item.checkedQty && item.quantity > 0;
    const checkedColor = getCheckStatusColor(item.checkedQty, item.quantity);

    return (
      <div key={item.id} className="relative">
        <div
          className={`group ${checkedColor} grid w-full border transition-colors ${
            isCountColumnVisible ? "grid-cols-23" : "grid-cols-19"
          }`}
        >
          <div className="col-span-2 h-full w-full border-r">
            <div className="flex h-full w-full items-center justify-between gap-2 px-4">
              <GripVertical
                className="hover:bg-accent invisible px-1 py-1 group-hover:visible hover:cursor-grab"
                size={33}
              />
              <span className="text-xl font-medium">{idx + 1}</span>
              <Trash2
                className="text-destructive hover:bg-accent invisible rounded-md px-1 py-1 group-hover:visible hover:scale-103 hover:cursor-pointer active:scale-98"
                size={33}
                onClick={() => deleteLineItem(item.rowId)}
              />
            </div>
          </div>
          <div className="col-span-7 border-r px-1 py-1">
            <input
              value={item.productSnapshot}
              className="focus:border-ring focus:ring-ring bg-background w-full rounded-lg border px-2 py-2 text-lg font-bold shadow-xs transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
              onClick={() => {
                setSearchRow(idx + 1);
                setIsDropdownOpen();
              }}
              onChange={(e) => {
                setSearchParam(e.target.value);
                updateLineItem(item.rowId, "name", e.target.value);
              }}
            />
          </div>
          <div className="col-span-3 h-full w-full border-r px-1 py-1">
            <div className="border-border bg-background relative flex h-full w-full items-center rounded-lg border font-bold shadow-xs">
              <button
                onClick={() => {
                  if (item.quantity >= 0) {
                    const newQuantity = item.quantity + 1;
                    updateLineItem(item.rowId, "quantity", newQuantity);
                  }
                }}
                className="hover:bg-primary/80 bg-primary text-foreground flex h-full w-20 cursor-pointer items-center justify-center rounded-lg rounded-r-none transition-all active:scale-95"
              >
                <Plus size={22} />
              </button>
              <input
                type="number"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setQtyPresetOpen(idx);
                }}
                value={item.quantity === 0 ? "" : item.quantity}
                className="focus:border-ring focus:ring-ring placeholder-muted-foreground w-full appearance-none rounded-lg px-2 py-2 text-center text-base font-semibold transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                onChange={(e) => {
                  updateLineItem(item.rowId, "quantity", e.target.value);
                }}
                placeholder="0"
              />
              <button
                disabled={item.quantity <= 0}
                className="hover:bg-primary/80 bg-primary text-foreground flex h-full w-20 cursor-pointer items-center justify-center rounded-lg rounded-l-none transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  if (item.quantity > 1) {
                    const newQuantity = item.quantity - 1;
                    updateLineItem(item.rowId, "quantity", newQuantity);
                  }
                }}
              >
                <Minus size={22} />
              </button>
              <QuantityPresets
                rowId={item.rowId}
                qtyPresetOpen={qtyPresetOpen}
                idx={idx}
                setQtyPresetOpen={setQtyPresetOpen}
              />
            </div>
          </div>
          <div className="col-span-3 border-r px-1 py-1">
            <div className="relative h-full w-full">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <IndianRupee size={18} />
              </span>
              <input
                type="number"
                placeholder="0"
                value={item.price === 0 ? "" : item.price / 100}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    updateLineItem(item.rowId, "price", 0);
                  } else {
                    const paise = Math.round(Number.parseFloat(val) * 100);
                    updateLineItem(item.rowId, "price", paise);
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="focus:border-ring focus:ring-ring bg-background text-foreground placeholder-muted-foreground h-full w-full appearance-none rounded-lg border py-2 pr-7 pl-10 text-right text-base font-semibold focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="col-span-3 px-1 py-1">
            <div className="relative h-full w-full">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <IndianRupee size={18} />
              </span>
              <div className="focus:border-ring focus:ring-ring bg-background text-foreground placeholder-muted-foreground h-full w-full appearance-none rounded-lg border py-2 pr-7 pl-10 text-right text-base font-semibold focus:ring-2 focus:outline-none disabled:cursor-not-allowed">
                {item.totalPrice === 0 ? "0" : item.totalPrice / 100}
              </div>
            </div>
          </div>
          <div className="col-span-1 flex items-center justify-center py-1">
            <button
              onClick={() => {
                const newCheckedAt = checked ? 0 : item.quantity;
                updateLineItem(item.rowId, "checkedQty", newCheckedAt);
              }}
              className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-all ${
                checked
                  ? "bg-success border-success"
                  : "border-muted-foreground hover:border-foreground"
              }`}
            >
              {checked && <Check className="text-background" strokeWidth={3} size={18} />}
            </button>
          </div>
          {isCountColumnVisible && (
            <>
              <div className="col-span-2 flex items-center justify-center py-1">
                <span className="text-base font-semibold whitespace-nowrap">
                  {item.checkedQty}/{item.quantity}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-center gap-1 py-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCheckedAt = updateCheckedQuantity(
                      UPDATE_QTY_ACTION.INCREMENT,
                      item.quantity,
                      item.checkedQty
                    );
                    updateLineItem(item.rowId, "checkedQty", newCheckedAt);
                  }}
                  disabled={checked}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center bg-transparent p-0"
                >
                  <Plus className="size-5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCheckedAt = updateCheckedQuantity(
                      UPDATE_QTY_ACTION.DECREMENT,
                      item.quantity,
                      item.checkedQty
                    );
                    updateLineItem(item.rowId, "checkedQty", newCheckedAt);
                  }}
                  disabled={item.checkedQty === 0}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center bg-transparent p-0"
                >
                  <Minus className="size-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {isDropdownOpen && searchRow === idx + 1 && <MemoizedSearchDropdown idx={idx} />}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item === nextProps.item &&
      prevProps.idx === nextProps.idx &&
      prevProps.isCountColumnVisible === nextProps.isCountColumnVisible
    );
  }
);

LineItemRow.displayName = "LineItemRow";

export default LineItemRow;
