import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { weights } from "@/constants/Weights";
import { useBillingStore } from "@/store/billingStore";
import { useEffect, useRef } from "react";

const QuantityPresets = ({
  itemId,
  idx,
  qtyPresetOpen,
  setQtyPresetOpen
}: {
  itemId: string;
  idx: number;
  qtyPresetOpen: number | null;
  setQtyPresetOpen: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  const popDownRef = useRef<HTMLDivElement | null>(null);
  const updateLineItems = useBillingStore((state) => state.updateLineItems);
  const numbers = Array.from({ length: 40 }, (_, i) => i + 1);

  function handlePresetClick(e: React.MouseEvent) {
    const button = (e.target as HTMLElement).closest("button");
    if (!button?.dataset.value) {
      return;
    }
    updateLineItems(itemId, "quantity", parseFloat(button.dataset.value));
    setQtyPresetOpen(null);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQtyPresetOpen(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popDownRef.current && !popDownRef.current.contains(e.target as Node))
        setQtyPresetOpen(null);
    };

    if (qtyPresetOpen != null) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [qtyPresetOpen, setQtyPresetOpen]);

  if (qtyPresetOpen != idx) {
    return null;
  }

  return (
    <>
      <div
        ref={popDownRef}
        className="bg-muted absolute top-full left-1/2 z-50 mt-2 w-max -translate-x-1/2 rounded-xl px-1 py-2 shadow-2xl"
      >
        <div className="grid w-max grid-flow-row grid-cols-4 gap-1 px-1">
          {weights.map((w, idx) => (
            <Button
              key={idx}
              variant="outline"
              data-value={w.weight}
              type="button"
              size="sm"
              className="col-span-1"
              onClick={(e) => {
                handlePresetClick(e);
              }}
            >
              {w.label}
            </Button>
          ))}
        </div>

        <Separator className="my-3 w-full bg-gray-300" />

        <div className="grid max-h-48 w-full grid-flow-row grid-cols-5 gap-1 overflow-y-auto scroll-smooth px-2 py-1">
          {numbers.map((i) => (
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-full hover:cursor-pointer"
              key={i}
              data-value={i}
              onClick={(e) => {
                handlePresetClick(e);
              }}
            >
              {i}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default QuantityPresets;
