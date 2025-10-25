import { Button } from "@/components/ui/button";
import useTransactionState from "@/hooks/useTransactionState";
import type { LineItemsType } from "@/store/billingStore";
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
  const { lineItems, addEmptyLineItem, setLineItems } = useTransactionState();

  useEffect(() => {
    setLineItems([]);
  }, [setLineItems]);

  return (
    <>
      <div className="mx-6 h-full">
        <div className="bg-background relative w-full flex-1 rounded-xl px-1 py-2 shadow-xl">
          <div className="text-accent-foreground border-border bg-accent grid grid-cols-20 items-center rounded-tl-lg rounded-tr-lg border py-1 text-base font-semibold">
            <div className="col-span-2 py-2 text-center">#</div>
            <div className="col-span-9 px-4 py-2 text-left">ITEM</div>
            <div className="col-span-3 px-4 py-2 text-left">QTY</div>
            <div className="col-span-3 px-4 py-2 text-left">PRICE</div>
            <div className="col-span-3 px-4 py-2 text-left">AMOUNT</div>
          </div>

          <div className="relative space-y-1 pt-2">
            {lineItems.map((item: LineItemsType, idx: number) => (
              <LineItemRow key={item.id} idx={idx} item={item} />
            ))}

            <div className="grid w-full grid-cols-10">
              <div className="col-span-1" />
              <div className="col-span-2 pt-2">
                <Button
                  className="hover:bg-primary/80 h-10 w-30 cursor-pointer text-lg font-medium"
                  onClick={() => addEmptyLineItem("button")}
                >
                  Add Row
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[500px] w-full" />
      </div>
    </>
  );
};

export default LineItemsTable;
