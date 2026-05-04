import { Button } from "@/components/ui/button";
import { useLineItemsStore, type LineItem } from "@/store/lineItemsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { getCheckStatusColor, updateCheckedQuantity } from "@/utils";
import { processSyncQueue } from "@/utils/syncWorker";
import { UPDATE_QTY_ACTION } from "@shared/types";
import { convertToRupees, fromMilliUnits, toMilliUnits } from "@shared/utils/utils";
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

    const { activeRowId, setActiveRowId, isDropdownOpen, setItemQuery, setIsDropdownOpen } =
      useSearchDropdownStore(
        useShallow((state) => ({
          activeRowId: state.activeRowId,
          setActiveRowId: state.setActiveRowId,
          isDropdownOpen: state.isDropdownOpen,
          setItemQuery: state.setItemQuery,
          setIsDropdownOpen: state.setIsDropdownOpen
        }))
      );

    const [qtyPresetOpen, setQtyPresetOpen] = useState<number | null>(null);
    const qtyVal = parseFloat(item.quantity || "0");
    const checked = qtyVal === item.checkedQty && qtyVal > 0;
    const checkedColor = getCheckStatusColor(item.checkedQty, qtyVal);

    return (
      <div key={item.rowId} className="relative">
        <div
          className={`group ${checkedColor} border-border/70 hover:border-border grid w-full items-center rounded-xl border transition-[background-color,border-color,box-shadow] duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${
            isCountColumnVisible ? "grid-cols-23" : "grid-cols-19"
          }`}
        >
          <div className="col-span-2 h-full min-h-[4.1rem] px-2">
            <div className="flex h-full items-center justify-between gap-2">
              <GripVertical
                className="text-muted-foreground/60 hover:bg-accent/70 hover:text-foreground invisible rounded-lg group-hover:visible hover:cursor-grab"
                size={24}
              />
              <span className="text-foreground text-lg font-semibold">{idx + 1}</span>
              <Trash2
                className="text-destructive/75 hover:bg-destructive/10 hover:text-destructive invisible rounded-lg group-hover:visible hover:cursor-pointer"
                size={28}
                onClick={() => {
                  deleteLineItem(item.rowId);
                  processSyncQueue();
                }}
              />
            </div>
          </div>
          <div className="col-span-7 px-1 py-1">
            <input
              value={item.productSnapshot}
              className="focus:border-ring focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground/80 border-border/80 h-11 w-full rounded-lg border px-3.5 py-6 text-lg font-bold shadow-none transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
              onClick={(e) => {
                setItemQuery((e.target as HTMLInputElement).value);
                setActiveRowId(item.rowId);
                setIsDropdownOpen();
              }}
              onChange={(e) => {
                setItemQuery(e.target.value);
                updateLineItem(item.rowId, "productSnapshot", e.target.value);
                processSyncQueue();
              }}
              placeholder="Search products"
            />
          </div>
          <div className="col-span-3 px-1 py-1">
            <div className="bg-muted/30 border-border/70 relative mx-auto flex h-12 w-full items-center rounded-lg border font-bold">
              <button
                onClick={() => {
                  const currentQty = parseFloat(item.quantity) || 0;
                  if (currentQty >= 0) {
                    const newQty = fromMilliUnits(toMilliUnits(currentQty + 1));
                    updateLineItem(item.rowId, "quantity", newQty.toString());
                    processSyncQueue();
                  }
                }}
                className="bg-background text-foreground hover:bg-accent/80 border-border/70 flex h-full w-12 cursor-pointer items-center justify-center rounded-l-lg border-r py-2 transition-colors"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
              <input
                type="text"
                inputMode="decimal"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setQtyPresetOpen(idx);
                }}
                value={item.quantity}
                className="focus:border-ring focus:ring-ring placeholder-muted-foreground min-w-0 flex-1 appearance-none bg-transparent px-1 py-2 text-center text-lg font-semibold transition-all"
                onChange={(e) => {
                  const val = e.target.value;
                  // allow only number and three decimal points
                  if (val === "" || /^\d*\.?\d{0,3}$/.test(val)) {
                    updateLineItem(item.rowId, "quantity", val);
                    processSyncQueue();
                  }
                }}
                placeholder="0"
              />
              <button
                disabled={parseFloat(item.quantity || "0") <= 1}
                className="bg-background text-foreground hover:bg-accent/80 border-border/70 flex h-full w-12 cursor-pointer items-center justify-center rounded-r-lg border-l py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  const currentQty = parseFloat(item.quantity) || 0;
                  if (currentQty >= 1) {
                    const newQty = fromMilliUnits(toMilliUnits(currentQty - 1));
                    updateLineItem(item.rowId, "quantity", newQty.toString());
                    processSyncQueue();
                  }
                }}
              >
                <Minus size={22} strokeWidth={2.5} />
              </button>
              <QuantityPresets
                rowId={item.rowId}
                qtyPresetOpen={qtyPresetOpen}
                idx={idx}
                setQtyPresetOpen={setQtyPresetOpen}
              />
            </div>
          </div>
          <div className="col-span-3 px-1 py-1">
            <div className="relative h-12 w-full">
              <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2">
                <IndianRupee size={16} />
              </span>
              <input
                type="string"
                value={item.price}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  // allow only number and two decimal points
                  if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                    updateLineItem(item.rowId, "price", val);
                    processSyncQueue();
                  }
                }}
                className="focus:border-ring focus:ring-ring bg-background text-foreground placeholder-muted-foreground border-border/80 h-full w-full appearance-none rounded-lg border py-2 pr-3 pl-9 text-right text-lg font-semibold focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="col-span-3 px-1 py-1">
            <div className="relative h-12 w-full">
              <span className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2">
                <IndianRupee size={16} />
              </span>
              <div className="bg-muted/25 border-border/70 text-foreground flex h-full w-full items-center justify-end rounded-lg border px-3 pl-9 text-right text-lg font-semibold">
                {item.totalPrice ? convertToRupees(item.totalPrice, { asString: true }) : "0"}
              </div>
            </div>
          </div>
          <div className="col-span-1 flex items-center justify-center px-1 py-1">
            <button
              onClick={() => {
                const currentQty = parseFloat(item.quantity || "0");
                const newCheckedAt = checked ? 0 : currentQty;
                updateLineItem(item.rowId, "checkedQty", newCheckedAt);
                processSyncQueue();
              }}
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-all ${
                checked
                  ? "border-success bg-success text-background"
                  : "border-border bg-background/90 text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {checked && <Check className="text-background" strokeWidth={3} size={18} />}
            </button>
          </div>
          {isCountColumnVisible && (
            <>
              <div className="col-span-2 flex items-center justify-center px-1 py-1">
                <span className="text-foreground/80 text-lg font-semibold whitespace-nowrap">
                  {item.checkedQty}/{item.quantity || "0"}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-center gap-1 px-1 py-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCheckedAt = updateCheckedQuantity(
                      UPDATE_QTY_ACTION.INCREMENT,
                      parseFloat(item.quantity || "0"),
                      item.checkedQty
                    );
                    updateLineItem(item.rowId, "checkedQty", newCheckedAt);
                    processSyncQueue();
                  }}
                  disabled={checked}
                  className="border-border/70 bg-background/80 hover:bg-background flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-0 shadow-none"
                >
                  <Plus className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCheckedAt = updateCheckedQuantity(
                      UPDATE_QTY_ACTION.DECREMENT,
                      parseFloat(item.quantity || "0"),
                      item.checkedQty
                    );
                    updateLineItem(item.rowId, "checkedQty", newCheckedAt);
                    processSyncQueue();
                  }}
                  disabled={item.checkedQty === 0}
                  className="border-border/70 bg-background/80 hover:bg-background flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-0 shadow-none"
                >
                  <Minus className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {isDropdownOpen && activeRowId === item.rowId && (
          <MemoizedSearchDropdown rowId={item.rowId} />
        )}
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
