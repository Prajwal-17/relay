import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useActiveTabId } from "@/features/billing/hooks/useActiveTabId";
import type { LineItem } from "@/features/billing/store/billingSession.types";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useProductsStore } from "@/features/products/products.store";
import { useSidebarStore } from "@/app/sidebar.store";
import { processSyncQueue } from "@/features/billing/syncWorker";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { fromMilliUnits, toMilliUnits } from "@shared/utils/milliUnits";
import { CheckCheck, ChevronDown, Columns3, PackagePlus, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BILLING_GRID_CLASS, BILLING_GRID_COUNT_CLASS, SortableLineItemRow } from "./LineItemRow";

export type ItemType = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
  totalPrice: number;
};

const LineItemsTable = () => {
  const updateField = useBillingSessionStore((state) => state.updateField);
  const addEmptyLineItem = useBillingSessionStore((state) => state.addEmptyLineItem);
  const setAllChecked = useBillingSessionStore((state) => state.setAllChecked);
  const reorderLineItems = useBillingSessionStore((state) => state.reorderLineItems);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setProductId = useProductsStore((state) => state.setProductId);
  const setIsDndDragging = useSidebarStore((state) => state.setIsDndDragging);

  const { activeTabId, getActiveTabId } = useActiveTabId();

  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    setSearchQuery("");
  }, [activeTabId]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("dragging-active");
    };
  }, []);

  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const isCountColumnVisible = session?.isCountColumnVisible ?? false;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!activeTabId || !session) {
    return null;
  }

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearchActive = trimmedQuery !== "";

  const visibleItems = session.lineItems.filter((item) => {
    if (item.isDeleted) return false;
    if (!isSearchActive) return true;
    return item.productSnapshot.toLowerCase().includes(trimmedQuery);
  });
  const filledItems = session.lineItems.filter(
    (item) => item.productSnapshot.trim() !== "" && !item.isDeleted
  );

  const filledRowIds = new Set(filledItems.map((i) => i.rowId));

  const collisionDetection: CollisionDetection = (args) => {
    const collisions = closestCenter(args);
    return collisions.filter((c) => filledRowIds.has(c.id as string));
  };

  const handleDragStart = () => {
    setIsDndDragging(true);
    document.body.classList.add("dragging-active");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDndDragging(false);
    document.body.classList.remove("dragging-active");

    if (!over || active.id === over.id) return;

    const tabId = getActiveTabId();
    if (!tabId) return;

    reorderLineItems(tabId, active.id as string, over.id as string);
    processSyncQueue(tabId);
  };

  const handleDragCancel = () => {
    setIsDndDragging(false);
    document.body.classList.remove("dragging-active");
  };

  const totalItems = filledItems.length;
  const totalQty = fromMilliUnits(
    session.lineItems.reduce((acc, item) => acc + toMilliUnits(parseFloat(item.quantity) || 0), 0)
  );
  const totalChecked = fromMilliUnits(
    session.lineItems.reduce((acc, item) => acc + toMilliUnits(item.checkedQty), 0)
  );
  const allChecked = totalQty > 0 && totalChecked === totalQty;

  const openNewProductDialog = () => {
    setProductId(null);
    setFormDataState({});
    setDialogMode("edit");
    setActionType("add");
    setOpenProductDialog();
  };

  return (
    <section className="mx-3 mt-2">
      <div className="border-frame bg-card w-full overflow-visible rounded-(--radius-panel) border px-2 pb-2">
        <div className="bg-card sticky top-0 z-10 flex h-11 items-center gap-2 border-b">
          <Button variant="outline" size="sm" onClick={openNewProductDialog}>
            <PackagePlus />
            New product
          </Button>

          <div className="relative w-52 min-w-36">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find bill item…"
              className="h-8 pr-8 pl-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5"
                aria-label="Clear item search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="text-muted-foreground ml-auto flex items-center gap-3 text-xs font-medium tabular-nums">
            <span>
              Items <strong className="text-foreground ml-1">{totalItems}</strong>
            </span>
            <span>
              Qty <strong className="text-foreground ml-1">{totalQty}</strong>
            </span>
            <span>
              Checked{" "}
              <strong className="ml-1">
                {allChecked ? "All" : String(totalChecked) + "/" + String(totalQty)}
              </strong>
            </span>
          </div>

          <Button
            type="button"
            variant={isCountColumnVisible ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              const tabId = getActiveTabId();
              if (!tabId) return;
              updateField(tabId, "isCountColumnVisible", !session.isCountColumnVisible);
            }}
            aria-pressed={isCountColumnVisible}
            className="gap-1.5"
          >
            <Columns3 />
            {isCountColumnVisible ? "Count on" : "Count off"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                onClick={() => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  setAllChecked(tabId, true);
                  processSyncQueue(tabId);
                }}
              >
                <CheckCheck />
                Check all
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const tabId = getActiveTabId();
                  if (!tabId) return;
                  setAllChecked(tabId, false);
                  processSyncQueue(tabId);
                }}
              >
                <X />
                Uncheck all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            "bg-table-header text-foreground grid h-8 items-center gap-1 border-b px-1 text-xs font-semibold",
            isCountColumnVisible ? BILLING_GRID_COUNT_CLASS : BILLING_GRID_CLASS
          )}
        >
          <div className="text-center">Row</div>
          <div>Product</div>
          <div className="text-center">Quantity</div>
          <div className="text-right">Price</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Checked</div>
          {isCountColumnVisible && (
            <>
              <div className="text-center">Count</div>
              <div className="text-center">Adjust</div>
            </>
          )}
        </div>

        <div className="relative space-y-1 py-1">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={visibleItems.map((item) => item.rowId)}
              strategy={verticalListSortingStrategy}
            >
              {visibleItems.map((item: LineItem, index: number) => (
                <SortableLineItemRow
                  key={item.rowId}
                  idx={index}
                  item={item}
                  isCountColumnVisible={isCountColumnVisible}
                  disableDrag={isSearchActive}
                />
              ))}
            </SortableContext>
          </DndContext>

          {isSearchActive && visibleItems.length === 0 && (
            <div className="text-muted-foreground py-6 text-center text-sm">
              No items match &ldquo;{searchQuery}&rdquo;.
            </div>
          )}

          <Button
            size="sm"
            onClick={() => {
              const tabId = getActiveTabId();
              if (!tabId) return;
              addEmptyLineItem(tabId, "button");
            }}
            className="mt-1"
          >
            <Plus />
            Add row
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LineItemsTable;
