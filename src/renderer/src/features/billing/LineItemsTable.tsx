import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import useTransactionState from "@/hooks/useTransactionState";
import type { LineItem } from "@/store/lineItemsStore";
import { CheckCheck, ChevronDown, X } from "lucide-react";
import { useEffect } from "react";
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
  const { lineItems, addEmptyLineItem, setLineItems, setAllChecked } = useTransactionState();

  useEffect(() => {
    setLineItems([]);
  }, [setLineItems]);

  return (
    <>
      <div className="mx-6 h-full">
        <div className="bg-background relative w-full flex-1 rounded-xl px-1 py-2 shadow-xl">
          <div className="text-accent-foreground border-border bg-accent grid grid-cols-23 items-center rounded-tl-lg rounded-tr-lg border py-1 text-base font-semibold">
            <div className="col-span-2 py-2 text-center">#</div>
            <div className="col-span-7 px-4 py-2 text-center">ITEM</div>
            <div className="col-span-3 px-4 py-2 text-center">QTY</div>
            <div className="col-span-3 px-4 py-2 text-center">PRICE</div>
            <div className="col-span-3 px-4 py-2 text-center">AMOUNT</div>
            <div className="col-span-1 px-1 py-2 text-center">Box</div>
            <div className="col-span-2 px-1 py-2 text-center">Count</div>
            <div className="col-span-2 px-1 py-2 text-center">Button</div>
          </div>

          <div className="relative space-y-1 pt-2">
            {lineItems.map((item: LineItem, idx: number) => (
              <LineItemRow key={item.rowId} idx={idx} item={item} />
            ))}

            <div className="flex justify-between px-4 py-2">
              <Button
                className="hover:bg-primary/80 ml-28 h-full w-30 cursor-pointer text-lg font-medium"
                onClick={() => addEmptyLineItem("button")}
              >
                Add Row
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="cursor-pointer text-lg">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setAllChecked(true);
                    }}
                    className="text-success/70 focus:text-success/90 cursor-pointer text-base font-medium"
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Check All
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setAllChecked(false);
                    }}
                    className="text-destructive/70 focus:text-destructive/90 cursor-pointer text-base font-medium"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Uncheck All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="h-[500px] w-full" />
      </div>
    </>
  );
};

export default LineItemsTable;
