import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useActiveTabId } from "@/hooks/billing/useActiveTabId";
import type { LineItem } from "@/store/billing/billingSession.types";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useProductsStore } from "@/store/productsStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { processSyncQueue } from "@/utils/syncWorker";
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
import {
  CheckCheck,
  ChevronDown,
  PackagePlus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { SortableLineItemRow } from "./LineItemRow";

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDndDragging(false);

    if (!over || active.id === over.id) return;

    const tabId = getActiveTabId();
    if (!tabId) return;

    reorderLineItems(tabId, active.id as string, over.id as string);
    processSyncQueue(tabId);
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
    <div className="mx-4 h-full">
      <div className="border-border/70 bg-background relative w-full flex-1 rounded-xl border px-4 pb-4 shadow-lg">
        <div className="bg-muted sticky top-0 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={openNewProductDialog}
            className="border-border bg-background hover:bg-muted/60 h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold shadow-none"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            New Product
          </Button>

          <div className="relative w-64 min-w-0">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items…"
              className="border-muted bg-muted/60 focus-visible:border-ring focus-visible:bg-background h-10 rounded-lg pr-9 pl-9 text-sm shadow-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-base font-medium">
              <div className="flex items-center gap-2">
                <span className="tracking-wider uppercase">Items</span>
                <span className="text-foreground text-lg font-semibold">{totalItems}</span>
              </div>
              <div className="bg-border/80 hidden h-5 w-px md:block" />
              <div className="flex items-center gap-2">
                <span className="tracking-wider uppercase">Qty</span>
                <span className="text-foreground text-lg font-semibold">{totalQty}</span>
              </div>
              <div className="bg-border/80 hidden h-5 w-px md:block" />
              <div className="flex items-center gap-2">
                <span className="tracking-wider uppercase">Checked</span>
                {allChecked ? (
                  <span className="text-success flex items-center gap-1.5 text-base font-semibold">
                    <CheckCheck className="h-4 w-4" />
                    All Checked
                  </span>
                ) : (
                  <span
                    className={`text-base font-semibold ${
                      totalChecked > 0 ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {totalChecked} / {totalQty}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border/80 bg-muted/60 hover:bg-muted/60 h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold shadow-none"
                >
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-44 rounded-xl p-1">
                <DropdownMenuItem
                  onClick={() => {
                    const tabId = getActiveTabId();
                    if (!tabId) return;
                    setAllChecked(tabId, true);
                    processSyncQueue(tabId);
                  }}
                  className="text-success/80 focus:text-success cursor-pointer px-3 py-2.5 text-sm font-medium"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Check All
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const tabId = getActiveTabId();
                    if (!tabId) return;
                    setAllChecked(tabId, false);
                    processSyncQueue(tabId);
                  }}
                  className="text-destructive/80 focus:text-destructive cursor-pointer px-3 py-2.5 text-sm font-medium"
                >
                  <X className="mr-2 h-4 w-4" />
                  Uncheck All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              onClick={() => {
                const tabId = getActiveTabId();
                if (!tabId) return;
                updateField(tabId, "isCountColumnVisible", !session.isCountColumnVisible);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/60 h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold"
              title={isCountColumnVisible ? "Hide count column" : "Show count column"}
            >
              {isCountColumnVisible ? (
                <PanelRightClose className="mr-2 h-4 w-4" />
              ) : (
                <PanelRightOpen className="mr-2 h-4 w-4" />
              )}
              Count
            </Button>
          </div>
        </div>

        <div
          className={`text-muted-foreground border-border/80 grid items-center border-b border-dashed px-2 pb-2 text-sm font-semibold tracking-wider uppercase ${
            isCountColumnVisible ? "grid-cols-23" : "grid-cols-19"
          }`}
        >
          <div className="col-span-2 px-3 text-center">#</div>
          <div className="col-span-7 px-4 text-left">Item</div>
          <div className="col-span-3 px-4 text-left">Qty</div>
          <div className="col-span-3 px-4 text-left">Price</div>
          <div className="col-span-3 px-4 text-left">Amount</div>
          {isCountColumnVisible ? (
            <>
              <div className="col-span-1 px-2 text-center">Box</div>
              <div className="col-span-2 px-2 text-center">Count</div>
              <div className="col-span-2 px-2 text-center">Adjust</div>
            </>
          ) : (
            <div className="col-span-1 px-2 text-center">Box</div>
          )}
        </div>

        <div className="relative space-y-1 pt-2.5">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={() => setIsDndDragging(true)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleItems.map((i) => i.rowId)}
              strategy={verticalListSortingStrategy}
            >
              {visibleItems.map((item: LineItem, idx: number) => (
                <SortableLineItemRow
                  key={item.rowId}
                  idx={idx}
                  item={item}
                  isCountColumnVisible={isCountColumnVisible}
                  disableDrag={isSearchActive}
                />
              ))}
            </SortableContext>
          </DndContext>

          {isSearchActive && visibleItems.length === 0 && (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No items match &ldquo;{searchQuery}&rdquo;.
            </div>
          )}

          <div className="flex items-center justify-between px-1 pt-1">
            <Button
              size="lg"
              onClick={() => {
                const tabId = getActiveTabId();
                if (!tabId) return;
                addEmptyLineItem(tabId, "button");
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 cursor-pointer rounded-xl px-5 text-sm font-semibold shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
          </div>
        </div>
      </div>
      <div className="h-125 w-full" />
    </div>
  );
};

export default LineItemsTable;
