import { Button } from "@/components/ui/button";
import useTransactionState from "@/hooks/useTransactionState";
import { useEffect, useState } from "react";
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
  const {
    lineItems,
    addEmptyLineItem,
    updateLineItems,
    deleteLineItem,
    setLineItems,
    setSearchRow,
    setSearchParam,
    setIsDropdownOpen
  } = useTransactionState();

  const totalAmount = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const [qtyPresetOpen, setQtyPresetOpen] = useState<number | null>(null);

  useEffect(() => {
    setLineItems([]);
  }, [setLineItems]);

  return (
    <>
      <div className="border-border relative flex-1 border pb-72">
        <div className="space-y-0">
          <div className="text-accent-foreground border-border grid grid-cols-20 items-center border bg-gray-100 text-base font-semibold">
            <div className="col-span-2 border-r border-gray-300 py-2 text-center">#</div>
            <div className="col-span-9 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
            <div className="col-span-3 border-r border-gray-300 px-2 py-2 text-left">QTY</div>
            <div className="col-span-3 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
            <div className="col-span-3 px-2 py-2 text-left">AMOUNT</div>
          </div>

          <div className="relative h-full space-y-1 pt-3 pb-72">
            {lineItems.map((item, idx: number) => (
              // idx,
              // item,
              // deleteLineItem,
              // updateLineItems,
              // setSearchRow,
              // setIsDropdownOpen,
              // setSearchParam,
              // setQtyPresetOpen,
              // qtyPresetOpen
              <LineItemRow
                key={item.id}
                idx={idx}
                item={item}
                deleteLineItem={deleteLineItem}
                updateLineItems={updateLineItems}
                setSearchRow={setSearchRow}
                setIsDropdownOpen={setIsDropdownOpen}
                setSearchParam={setSearchParam}
                setQtyPresetOpen={setQtyPresetOpen}
                qtyPresetOpen={qtyPresetOpen}
              />
            ))}

            <div className="grid w-full grid-cols-10 border bg-neutral-100">
              <div className="col-span-1"></div>
              <div className="col-span-2">
                <Button className="hover:cursor-pointer" onClick={addEmptyLineItem}>
                  Add Row
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t-border absolute bottom-0 flex h-16 w-3/4 items-center justify-between border bg-white px-6 py-4">
        <div className="text-xl font-bold">Total Amount:</div>
        <div className="text-primary text-3xl font-extrabold">₹ {totalAmount.toFixed(2)}</div>
      </div>
    </>
  );
};

export default LineItemsTable;
