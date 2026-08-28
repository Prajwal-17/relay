import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MAX_PRESET_COUNT, weights } from "@/constants/renderer.constants";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { processSyncQueue } from "@/features/billing/syncWorker";
import { useEffect, useRef } from "react";

const QuantityPresets = ({
  rowId,
  idx,
  qtyPresetOpen,
  setQtyPresetOpen
}: {
  rowId: string;
  idx: number;
  qtyPresetOpen: number | null;
  setQtyPresetOpen: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  const popDownRef = useRef<HTMLDivElement | null>(null);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const updateLineItem = useBillingSessionStore((state) => state.updateLineItem);
  const numbers = Array.from({ length: MAX_PRESET_COUNT }, (_, i) => i + 1);

  function handlePresetClick(e: React.MouseEvent) {
    const button = (e.target as HTMLElement).closest("button");
    if (!button?.dataset.value) {
      return;
    }
    if (!activeTabId) return;
    updateLineItem(activeTabId, rowId, "quantity", button.dataset.value);
    processSyncQueue(activeTabId);
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
        className="bg-popover border-border absolute top-full left-1/2 z-50 mt-1.5 w-72 -translate-x-1/2 rounded-(--radius-panel) border p-2 shadow-md"
      >
        <div className="grid w-full grid-cols-5 gap-1">
          {weights.map((w, idx) => (
            <Button
              key={idx}
              variant="outline"
              data-value={w.weight}
              type="button"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                handlePresetClick(e);
              }}
            >
              {w.label}
            </Button>
          ))}
        </div>

        <Separator className="bg-border my-1.5 w-full" />

        <div className="grid w-full grid-cols-8 gap-1">
          {numbers.map((i) => (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full px-0 text-xs hover:cursor-pointer"
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
