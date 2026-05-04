import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLineItemsStore, type LineItem } from "@/store/lineItemsStore";
import { useProductsStore } from "@/store/productsStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { fromMilliUnits, toMilliUnits } from "@shared/utils/utils";
import {
  CheckCheck,
  ChevronDown,
  PackagePlus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  X
} from "lucide-react";
import LineItemRow from "./LineItemRow";

export type ItemType = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
  totalPrice: number;
};

const LineItemsTable = () => {
  const isCountColumnVisible = useLineItemsStore((state) => state.isCountColumnVisible);
  const setIsCountControlsVisible = useLineItemsStore((state) => state.setIsCountControlsVisible);
  const lineItems = useLineItemsStore((state) => state.lineItems);
  const addEmptyLineItem = useLineItemsStore((state) => state.addEmptyLineItem);
  const setAllChecked = useLineItemsStore((state) => state.setAllChecked);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setProductId = useProductsStore((state) => state.setProductId);

  const totalItems = lineItems.filter((item) => item.productSnapshot.trim() !== "").length;
  const totalQty = fromMilliUnits(
    lineItems.reduce((acc, item) => acc + toMilliUnits(parseFloat(item.quantity) || 0), 0)
  );
  const totalChecked = fromMilliUnits(
    lineItems.reduce((acc, item) => acc + toMilliUnits(item.checkedQty), 0)
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
      <div className="border-border/70 bg-background/95 relative w-full flex-1 rounded-xl border px-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))] px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={openNewProductDialog}
            className="border-border bg-background hover:bg-muted/60 h-11 cursor-pointer rounded-xl px-5 text-base font-semibold shadow-none"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            New Product
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-[1.05rem] font-medium">
              <div className="flex items-center gap-2">
                <span className="tracking-[0.14em] uppercase">Items</span>
                <span className="text-foreground text-xl font-semibold">{totalItems}</span>
              </div>
              <div className="bg-border/80 hidden h-5 w-px md:block" />
              <div className="flex items-center gap-2">
                <span className="tracking-[0.14em] uppercase">Qty</span>
                <span className="text-foreground text-xl font-semibold">{totalQty}</span>
              </div>
              <div className="bg-border/80 hidden h-5 w-px md:block" />
              <div className="flex items-center gap-2">
                <span className="tracking-[0.14em] uppercase">Checked</span>
                {allChecked ? (
                  <span className="text-success flex items-center gap-1.5 text-[1.05rem] font-semibold">
                    <CheckCheck className="h-4.5 w-4.5" />
                    All Checked
                  </span>
                ) : (
                  <span
                    className={`text-[1.05rem] font-semibold ${
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
                  className="border-border/80 bg-background/80 hover:bg-muted/60 h-12 cursor-pointer rounded-xl px-5 text-base font-semibold shadow-none"
                >
                  Actions
                  <ChevronDown className="ml-2 h-4.5 w-4.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-44 rounded-xl p-1">
                <DropdownMenuItem
                  onClick={() => {
                    setAllChecked(true);
                    processSyncQueue();
                  }}
                  className="text-success/80 focus:text-success cursor-pointer px-3 py-2.5 text-base font-medium"
                >
                  <CheckCheck className="mr-2 h-4.5 w-4.5" />
                  Check All
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setAllChecked(false);
                    processSyncQueue();
                  }}
                  className="text-destructive/80 focus:text-destructive cursor-pointer px-3 py-2.5 text-base font-medium"
                >
                  <X className="mr-2 h-4.5 w-4.5" />
                  Uncheck All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              onClick={setIsCountControlsVisible}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/60 h-11 cursor-pointer rounded-xl px-4 text-base font-semibold"
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
          className={`text-muted-foreground border-border/80 grid items-center border-b border-dashed px-2 pb-2 text-[0.92rem] font-semibold tracking-[0.14em] uppercase ${
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

        <div className="relative space-y-1.5 pt-2.5">
          {lineItems.map(
            (item: LineItem, idx: number) =>
              !item.isDeleted && (
                <LineItemRow
                  key={item.rowId}
                  idx={idx}
                  item={item}
                  isCountColumnVisible={isCountColumnVisible}
                />
              )
          )}

          <div className="flex items-center justify-between px-1 pt-1">
            <Button
              size="lg"
              onClick={() => addEmptyLineItem("button")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 cursor-pointer rounded-xl px-6 text-base font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
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
