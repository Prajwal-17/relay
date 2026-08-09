import { Button } from "@/components/ui/button";
import { useActiveTabId } from "@/features/billing/hooks/useActiveTabId";
import { cn } from "@/lib/utils";
import type { LineItem } from "@/features/billing/store/billingSession.types";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useSearchDropdownStore } from "@/features/billing/product-search/searchDropdown.store";
import { getCheckStatusColor, updateCheckedQuantity } from "@/utils/renderer.utils";
import { processSyncQueue } from "@/features/billing/syncWorker";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UPDATE_QTY_ACTION } from "@shared/types";
import { fromMilliUnits, toMilliUnits } from "@shared/utils/milliUnits";
import { paisaToRupeeString } from "@shared/utils/utils";
import { Check, GripVertical, IndianRupee, Minus, Plus, Trash2 } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { MemoizedProductSearchDropdown } from "./product-search/MemoizedProductSearchDropdown";
import QuantityPresets from "./QuantityPresets";

export type DragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
};

type LineItemRowProps = {
  idx: number;
  item: LineItem;
  isCountColumnVisible: boolean;
  dragHandle?: DragHandle;
  disableDrag?: boolean;
};

const LineItemRow = memo(
  ({ idx, item, isCountColumnVisible, dragHandle, disableDrag }: LineItemRowProps) => {
    const { activeTabId, getActiveTabId } = useActiveTabId();

    const updateLineItem = useBillingSessionStore((state) => state.updateLineItem);
    const deleteLineItem = useBillingSessionStore((state) => state.deleteLineItem);

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
    const partiallyChecked = item.checkedQty > 0 && item.checkedQty < qtyVal;
    const checkedColor = getCheckStatusColor(item.checkedQty, qtyVal);
    const checkedFieldColor = checked
      ? "bg-line-item-complete-field"
      : partiallyChecked
        ? "bg-line-item-partial-field"
        : "bg-background";

    const [isFlash, setIsFlash] = useState(false);
    const prevTotalRef = useRef(item.totalPrice);
    useEffect(() => {
      if (prevTotalRef.current !== item.totalPrice) {
        prevTotalRef.current = item.totalPrice;
        if (
          item.totalPrice !== 0 &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          setIsFlash(true);
          const timer = setTimeout(() => setIsFlash(false), 700);
          return () => clearTimeout(timer);
        }
      }
    }, [item.totalPrice]);

    if (!activeTabId) return null;

    return (
      <div key={item.rowId} data-billing-row-id={item.rowId} className="relative">
        <div
          data-check-state={checked ? "complete" : partiallyChecked ? "partial" : "unchecked"}
          className={cn(
            "group focus-within:ring-focus/40 relative grid min-h-(--billing-row-height) w-full items-center gap-0.5 rounded-lg border px-0.5 transition-[background-color,border-color,box-shadow] duration-150 focus-within:ring-1",
            checkedColor,
            dragHandle?.isDragging && "ring-primary/30 z-20 shadow-lg ring-2",
            isCountColumnVisible ? "billing-grid-count" : "billing-grid"
          )}
        >
          <div className="h-full min-w-0">
            <div className="flex h-full items-center justify-between gap-1">
              {dragHandle && item.productSnapshot.trim() !== "" && !disableDrag ? (
                <button
                  type="button"
                  {...dragHandle.attributes}
                  {...dragHandle.listeners}
                  aria-label={"Move row " + String(idx + 1)}
                  className={cn(
                    "text-foreground hover:bg-hover focus-visible:ring-focus/60 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-(--radius-control) focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing",
                    dragHandle.isDragging && "bg-selected cursor-grabbing"
                  )}
                >
                  <GripVertical size={18} />
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className="text-foreground flex size-6 shrink-0 items-center justify-center opacity-0"
                >
                  <GripVertical size={18} />
                </span>
              )}
              <span className="text-foreground text-sm font-semibold">{idx + 1}</span>
              <button
                type="button"
                aria-label={`Delete row ${idx + 1}`}
                className="text-destructive hover:bg-destructive/10 flex size-7.5 items-center justify-center rounded-(--radius-control) opacity-0 transition-[opacity,color,background-color] group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100"
                onClick={() => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  deleteLineItem(tabId, item.rowId);
                  processSyncQueue(tabId);
                }}
              >
                <Trash2 size={18} strokeWidth={2.25} />
              </button>
            </div>
          </div>
          <div className="relative min-w-0">
            <input
              value={item.productSnapshot}
              className={cn(
                "focus-visible:border-ring focus-visible:ring-ring/50 text-foreground placeholder:text-muted-foreground/80 border-input h-9 w-full rounded-lg border px-3 py-2 text-base font-semibold shadow-xs transition-[border-color,box-shadow,background-color,color] outline-none focus-visible:ring-2",
                checkedFieldColor
              )}
              onClick={(e) => {
                setItemQuery((e.target as HTMLInputElement).value);
                setActiveRowId(item.rowId);
                setIsDropdownOpen(true);
              }}
              onChange={(e) => {
                const tabId = getActiveTabId();
                if (!tabId) return;
                setItemQuery(e.target.value);
                updateLineItem(tabId, item.rowId, "productSnapshot", e.target.value);
                processSyncQueue(tabId);
              }}
              placeholder="Search products"
            />

            {isDropdownOpen && activeRowId === item.rowId && (
              <MemoizedProductSearchDropdown rowId={item.rowId} />
            )}
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                "border-input focus-within:border-ring focus-within:ring-ring/50 relative mx-auto flex h-9 w-full items-center rounded-lg border font-bold shadow-xs transition-[border-color,box-shadow,background-color] focus-within:ring-2",
                checkedFieldColor
              )}
            >
              <button
                className={cn(
                  "text-foreground hover:bg-hover border-border flex h-full w-8 cursor-pointer items-center justify-center rounded-l-lg border-r transition-colors",
                  checkedFieldColor
                )}
                onClick={() => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  const currentQty = parseFloat(item.quantity) || 0;
                  const newQty = fromMilliUnits(toMilliUnits(currentQty + 1));
                  updateLineItem(tabId, item.rowId, "quantity", newQty.toString());
                  processSyncQueue(tabId);
                }}
                aria-label="Increase quantity"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
              <input
                type="text"
                inputMode="decimal"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setQtyPresetOpen(idx);
                }}
                value={item.quantity}
                className="placeholder:text-muted-foreground/60 min-w-0 flex-1 appearance-none bg-transparent px-1 py-2 text-center text-sm font-semibold tabular-nums outline-none"
                onChange={(e) => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d{0,3}$/.test(val)) {
                    updateLineItem(tabId, item.rowId, "quantity", val);
                    processSyncQueue(tabId);
                  }
                }}
                placeholder="0"
              />
              <button
                disabled={parseFloat(item.quantity || "0") <= 1}
                className={cn(
                  "text-foreground hover:bg-hover border-border flex h-full w-8 cursor-pointer items-center justify-center rounded-r-lg border-l transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  checkedFieldColor
                )}
                onClick={() => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  const currentQty = parseFloat(item.quantity) || 0;
                  if (currentQty >= 1) {
                    const newQty = fromMilliUnits(toMilliUnits(currentQty - 1));
                    updateLineItem(tabId, item.rowId, "quantity", newQty.toString());
                    processSyncQueue(tabId);
                  }
                }}
                aria-label="Decrease quantity"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <QuantityPresets
                rowId={item.rowId}
                qtyPresetOpen={qtyPresetOpen}
                idx={idx}
                setQtyPresetOpen={setQtyPresetOpen}
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="relative h-9 w-full">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <IndianRupee size={14} />
              </span>
              <input
                type="text"
                value={item.price}
                placeholder="0"
                onChange={(e) => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                    updateLineItem(tabId, item.rowId, "price", val);
                    processSyncQueue(tabId);
                  }
                }}
                className={cn(
                  "focus-visible:border-ring focus-visible:ring-ring/50 text-foreground placeholder:text-muted-foreground/60 border-input h-full w-full appearance-none rounded-lg border py-2 pr-3 pl-8 text-right text-sm font-semibold tabular-nums shadow-xs outline-none focus-visible:ring-2 disabled:cursor-not-allowed",
                  checkedFieldColor
                )}
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="relative h-9 w-full">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <IndianRupee size={14} />
              </span>
              <div
                className={cn(
                  "border-input text-foreground flex h-full w-full items-center justify-end rounded-lg border px-3 pl-8 text-right text-sm font-semibold tabular-nums shadow-xs transition-[background-color] duration-150",
                  checked
                    ? "bg-line-item-complete-field"
                    : partiallyChecked
                      ? "bg-line-item-partial-field"
                      : isFlash
                        ? "bg-accent"
                        : "bg-muted/40"
                )}
              >
                {item.totalPrice ? paisaToRupeeString(item.totalPrice) : "0"}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const tabId = getActiveTabId();
                if (!tabId) return;
                const currentQty = parseFloat(item.quantity || "0");
                const newCheckedAt = checked ? 0 : currentQty;
                updateLineItem(tabId, item.rowId, "checkedQty", newCheckedAt);
                processSyncQueue(tabId);
              }}
              type="button"
              role="checkbox"
              aria-checked={partiallyChecked ? "mixed" : checked}
              aria-label={checked ? "Mark item unchecked" : "Mark item checked"}
              className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-(--radius-control) border transition-[border-color,box-shadow,background-color,color] ${
                checked
                  ? "border-success bg-success text-success-foreground"
                  : partiallyChecked
                    ? "border-warning bg-warning text-warning-foreground"
                    : "border-border bg-muted/70 text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {checked && <Check strokeWidth={3} size={18} />}
              {partiallyChecked && <Minus strokeWidth={3} size={18} />}
            </button>
          </div>
          {isCountColumnVisible && (
            <>
              <div className="flex min-w-0 items-center justify-center">
                <span className="text-foreground/80 text-sm font-semibold whitespace-nowrap tabular-nums">
                  {item.checkedQty}/{item.quantity || "0"}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={"Increase checked quantity"}
                  onClick={() => {
                    const tabId = getActiveTabId();
                    if (!tabId) return;
                    const newCheckedAt = updateCheckedQuantity(
                      UPDATE_QTY_ACTION.INCREMENT,
                      parseFloat(item.quantity || "0"),
                      item.checkedQty
                    );
                    updateLineItem(tabId, item.rowId, "checkedQty", newCheckedAt);
                    processSyncQueue(tabId);
                  }}
                  disabled={checked}
                  className="border-border/70 bg-muted/60 hover:bg-hover flex h-8 w-8 cursor-pointer items-center justify-center rounded-(--radius-control) p-0 shadow-none"
                >
                  <Plus className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  aria-label={"Decrease checked quantity"}
                  onClick={() => {
                    const tabId = getActiveTabId();
                    if (!tabId) return;
                    const newCheckedAt = updateCheckedQuantity(
                      UPDATE_QTY_ACTION.DECREMENT,
                      parseFloat(item.quantity || "0"),
                      item.checkedQty
                    );
                    updateLineItem(tabId, item.rowId, "checkedQty", newCheckedAt);
                    processSyncQueue(tabId);
                  }}
                  disabled={item.checkedQty === 0}
                  className="border-border/70 bg-muted/60 hover:bg-hover flex h-8 w-8 cursor-pointer items-center justify-center rounded-(--radius-control) p-0 shadow-none"
                >
                  <Minus className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item === nextProps.item &&
      prevProps.idx === nextProps.idx &&
      prevProps.isCountColumnVisible === nextProps.isCountColumnVisible &&
      prevProps.disableDrag === nextProps.disableDrag &&
      prevProps.dragHandle?.isDragging === nextProps.dragHandle?.isDragging
    );
  }
);

LineItemRow.displayName = "LineItemRow";

export const SortableLineItemRow = (props: Omit<LineItemRowProps, "dragHandle">) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.rowId
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "z-20")}>
      <LineItemRow {...props} dragHandle={{ attributes, listeners, isDragging }} />
    </div>
  );
};

export default LineItemRow;
