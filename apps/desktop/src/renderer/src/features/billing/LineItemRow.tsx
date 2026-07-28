import { Button } from "@/components/ui/button";
import { useActiveTabId } from "@/hooks/billing/useActiveTabId";
import type { LineItem } from "@/store/billing/billingSession.types";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { getCheckStatusColor, updateCheckedQuantity } from "@/utils";
import { processSyncQueue } from "@/utils/syncWorker";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UPDATE_QTY_ACTION } from "@shared/types";
import { fromMilliUnits, toMilliUnits } from "@shared/utils/milliUnits";
import { paisaToRupeeString } from "@shared/utils/utils";
import { Check, GripVertical, IndianRupee, Minus, Plus, Trash2 } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { MemoizedSearchDropdown } from "../search/MemoizedSearchDropDown";
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
    const checkedColor = getCheckStatusColor(item.checkedQty, qtyVal);

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
          className={`group ${checkedColor} border-border focus-within:border-border-strong grid min-h-(--billing-row-height) w-full items-center gap-1 rounded-(--radius-control) border px-1 transition-[background-color,border-color] duration-150 ${
            dragHandle?.isDragging ? "ring-primary/30 shadow-lg ring-2" : ""
          } ${isCountColumnVisible ? "billing-grid-count" : "billing-grid"}`}
        >
          <div className="h-full min-w-0">
            <div className="flex h-full items-center justify-between gap-1">
              {dragHandle && item.productSnapshot.trim() !== "" && !disableDrag ? (
                <GripVertical
                  {...dragHandle.attributes}
                  {...dragHandle.listeners}
                  className="text-muted-foreground/60 hover:bg-accent hover:text-foreground active:bg-accent cursor-grab rounded-(--radius-control) focus:outline-none active:cursor-grabbing"
                  size={20}
                />
              ) : (
                <GripVertical
                  className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-(--radius-control) opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:cursor-grab focus:outline-none"
                  size={20}
                />
              )}
              <span className="text-foreground text-sm font-semibold">{idx + 1}</span>
              <button
                type="button"
                aria-label={`Delete row ${idx + 1}`}
                className="text-destructive/75 hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded-(--radius-control) opacity-0 transition-[opacity,color,background-color] group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100"
                onClick={() => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  deleteLineItem(tabId, item.rowId);
                  processSyncQueue(tabId);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="relative min-w-0">
            <input
              value={item.productSnapshot}
              className="focus-visible:border-ring focus-visible:ring-ring/50 bg-background text-foreground placeholder:text-muted-foreground/80 border-border/80 h-9 w-full rounded-(--radius-control) border px-3 py-2 text-sm font-semibold shadow-none transition-[border-color,box-shadow,background-color,color] focus-visible:ring-2"
              onClick={(e) => {
                setItemQuery((e.target as HTMLInputElement).value);
                setActiveRowId(item.rowId);
                setIsDropdownOpen();
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
              <MemoizedSearchDropdown rowId={item.rowId} />
            )}
          </div>
          <div className="min-w-0">
            <div className="bg-muted/60 border-border/70 relative mx-auto flex h-9 w-full items-center rounded-(--radius-control) border font-bold">
              <button
                className="bg-background text-foreground hover:bg-accent border-border flex h-full w-8 cursor-pointer items-center justify-center rounded-l-(--radius-control) border-r transition-colors"
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
                className="focus-visible:border-ring focus-visible:ring-ring/50 placeholder:text-muted-foreground/60 min-w-0 flex-1 appearance-none rounded-md bg-transparent px-1 py-2 text-center text-sm font-semibold tabular-nums transition-[border-color,box-shadow,background-color,color] focus-visible:ring-2 focus-visible:ring-offset-0"
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
                className="bg-background text-foreground hover:bg-accent border-border flex h-full w-8 cursor-pointer items-center justify-center rounded-r-(--radius-control) border-l transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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
                className="focus-visible:border-ring focus-visible:ring-ring/50 bg-background text-foreground placeholder:text-muted-foreground/60 border-border/80 h-full w-full appearance-none rounded-(--radius-control) border py-2 pr-3 pl-8 text-right text-sm font-semibold tabular-nums focus-visible:ring-2 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="relative h-9 w-full">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <IndianRupee size={14} />
              </span>
              <div
                className={`bg-muted/40 border-border/70 text-foreground flex h-full w-full items-center justify-end rounded-(--radius-control) border px-3 pl-8 text-right text-sm font-semibold tabular-nums transition-[background-color] duration-150 ${isFlash ? "bg-accent" : ""}`}
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
              aria-label={checked ? "Mark item unchecked" : "Mark item checked"}
              className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-(--radius-control) border transition-[border-color,box-shadow,background-color,color] ${
                checked
                  ? "border-success bg-success text-background"
                  : "border-border bg-muted/70 text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {checked && <Check className="text-background" strokeWidth={3} size={18} />}
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
                  className="border-border/70 bg-muted/60 hover:bg-background flex h-8 w-8 cursor-pointer items-center justify-center rounded-(--radius-control) p-0 shadow-none"
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
                  className="border-border/70 bg-muted/60 hover:bg-background flex h-8 w-8 cursor-pointer items-center justify-center rounded-(--radius-control) p-0 shadow-none"
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
    <div ref={setNodeRef} style={style}>
      <LineItemRow {...props} dragHandle={{ attributes, listeners, isDragging }} />
    </div>
  );
};

export default LineItemRow;
