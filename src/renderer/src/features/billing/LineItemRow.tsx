import { GripVertical, IndianRupee, Minus, Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import SearchDropdown from "../search/SearchDropdown";
import QuantityPresets from "./QuantityPresets";

const areEqualProps = (prevProps, nextProps) => {
  // if (prevProps.item.name === nextProps.item.name) {
  //   return false;
  // }
  // console.log("prevProps", prevProps);
  // console.log("nextProps", nextProps);
  // return true;
  return prevProps.item === nextProps.item;
};

const LineItemRow = memo(
  ({
    idx,
    item,
    deleteLineItem,
    updateLineItems,
    setSearchRow,
    setIsDropdownOpen,
    setSearchParam,
    setQtyPresetOpen,
    qtyPresetOpen
  }: any) => {
    console.log("item idx", idx);
    return (
      <div key={idx} className="relative">
        <div className="group grid w-full grid-cols-20 border bg-neutral-100">
          <div className="col-span-2 h-full w-full border-r bg-white">
            <div className="flex h-full w-full items-center justify-between gap-2 px-4">
              <GripVertical
                className="invisible px-1 py-1 group-hover:visible hover:cursor-grab hover:bg-neutral-100"
                size={33}
              />
              <span className="text-xl">{idx + 1}</span>
              <Trash2
                className="text-destructive invisible rounded-md px-1 py-1 group-hover:visible hover:scale-103 hover:cursor-pointer hover:bg-neutral-100 active:scale-98"
                size={33}
                onClick={() => deleteLineItem(item.id)}
              />
            </div>
          </div>
          <div className="col-span-9 border-r px-1 py-1">
            <input
              value={item.name}
              className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-lg font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
              onClick={() => {
                setSearchRow(idx + 1);
                setIsDropdownOpen();
              }}
              onChange={(e) => {
                setSearchParam(e.target.value);
                updateLineItems(item.id, "name", e.target.value);
              }}
            />
          </div>
          <div className="col-span-3 h-full w-full border-r px-1 py-1">
            <div className="border-border relative flex h-full w-full items-center rounded-lg border bg-white font-bold shadow-sm">
              <button
                onClick={() => {
                  if (item.quantity >= 0) {
                    const newQuantity = item.quantity + 1;
                    updateLineItems(item.id, "quantity", newQuantity);
                  }
                }}
                className="hover:bg-primary/80 bg-primary flex h-full w-20 cursor-pointer items-center justify-center rounded-lg rounded-r-none text-white transition-all active:scale-95"
              >
                <Plus size={22} />
              </button>
              <input
                type="number"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setQtyPresetOpen(idx);
                }}
                value={item.quantity === 0 ? null : item.quantity}
                className="focus:border-ring focus:ring-ring w-full appearance-none rounded-lg px-2 py-2 text-center text-base font-semibold placeholder-gray-400 transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                onChange={(e) => {
                  updateLineItems(item.id, "quantity", e.target.value);
                }}
                placeholder="0"
              />
              <button
                disabled={item.quantity <= 0}
                className="hover:bg-primary/80 bg-primary flex h-full w-20 cursor-pointer items-center justify-center rounded-lg rounded-l-none text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  if (item.quantity > 1) {
                    const newQuantity = item.quantity - 1;
                    updateLineItems(item.id, "quantity", newQuantity);
                  }
                }}
              >
                <Minus size={22} />
              </button>
              <QuantityPresets
                itemId={item.id}
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
                value={item.price === 0 ? null : item.price}
                onChange={(e) => updateLineItems(item.id, "price", e.target.value)}
                className="focus:border-ring focus:ring-ring h-full w-full appearance-none rounded-lg border bg-white py-2 pr-7 pl-10 text-right text-base font-semibold text-black placeholder-gray-400 focus:ring-2 focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div className="col-span-3 border-r px-1 py-1">
            <div className="relative h-full w-full">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <IndianRupee size={18} />
              </span>
              <input
                disabled
                type="number"
                value={item.totalPrice === 0 ? "" : item.totalPrice}
                className="focus:border-ring focus:ring-ring h-full w-full appearance-none rounded-lg border bg-white py-2 pr-7 pl-10 text-right text-base font-semibold text-black placeholder-gray-400 focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <SearchDropdown idx={idx} />
      </div>
    );
  },
  areEqualProps
);

LineItemRow.displayName = "LineItemRow";

export default LineItemRow;
