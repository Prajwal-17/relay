import useTransaction from "@/hooks/billing/useTransaction";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import { TRANSACTION_TYPE } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { paisaToRupees } from "@shared/utils/utils";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";

export function BillPreview() {
  const { type } = useParams();
  const formattedType = type?.slice(0, -1);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );

  const lineItems = session?.lineItems ?? [];
  const transactionNo = session?.transactionNo ?? null;
  const billingDate = session?.billingDate ?? new Date();
  const customerName = session?.customerName ?? "";
  const { subtotal, grandTotal } = useTransaction();

  const setReceiptRef = useReceiptRefStore((state) => state.setReceiptRef);
  const removeReceiptRef = useReceiptRefStore((state) => state.removeReceiptRef);
  const localReceiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeTabId) return;
    setReceiptRef(activeTabId, localReceiptRef as React.RefObject<HTMLDivElement>);

    // clean up on unmount
    return () => {
      removeReceiptRef(activeTabId);
    };
  }, [activeTabId, setReceiptRef, removeReceiptRef]);
  if (!type) {
    return <Navigate to="/not-found" />;
  }
  if (!activeTabId || !session) return null;
  return (
    <div
      ref={localReceiptRef}
      className="receipt no-break font-roboto border-success bg-card text-foreground mt-0 mb-24 border px-1 pt-1"
    >
      <div className="mb-2 space-y-2 pb-4 text-center">
        <h1 className="text-lg font-bold tracking-tight">SRI MANJUNATHESHWARA STORES</h1>
        <p className="text-xs">6TH MAIN, RUKMINI NAGAR NAGASANDRA POST BANGALORE 560073</p>
        {formattedType === TRANSACTION_TYPE.SALE && (
          <p className="text-xs">
            <span className="font-semibold">GSTIN:</span>29BHBPR8333N2ZM
          </p>
        )}
        <p className="text-xs">
          <span className="font-semibold">Ph.No.:</span>
          9945029729
        </p>
      </div>
      <div className="border-foreground mb-4 flex justify-between border-t border-b border-dashed py-1 text-xs">
        <div>
          <div>
            <span className="font-semibold">Date:</span>{" "}
            {formatDateStrToISTDateStr(billingDate.toString()).fullDate}
          </div>
          <div>
            <span className="font-semibold">
              {formattedType === TRANSACTION_TYPE.SALE ? "Invoice No:" : "Estimate No:"}
            </span>{" "}
            {transactionNo ?? "New"}
          </div>
          <div>
            <span className="font-semibold">Name:</span>{" "}
            {customerName === "DEFAULT" || customerName === ""
              ? formattedType === TRANSACTION_TYPE.SALE
                ? "Sale"
                : "Estimate"
              : customerName}
          </div>
        </div>
        <div>
          <span className="font-semibold">Time:</span>
          {formatDateStrToISTDateStr(billingDate.toString()).timePart}
        </div>
      </div>
      <div className="border-foreground grid grid-cols-12 border-b border-dashed pb-1 text-xs font-bold">
        <div className="col-span-1">#</div>
        <div className="col-span-3">ITEM</div>
        <div className="col-span-2 text-center">QTY</div>
        <div className="col-span-3 text-right">RATE</div>
        <div className="col-span-3 text-right">AMT</div>
      </div>
      <div className="border-foreground border-b border-dashed text-xs font-medium">
        {lineItems.map((item, idx) => {
          if (item.productSnapshot === "") return;
          return (
            <div key={idx} className="grid grid-cols-12 py-1">
              <div className="col-span-1">{idx + 1}.</div>
              <div className="col-span-5">{item.productSnapshot}</div>
              <div className="col-span-2 text-center tracking-tight">
                {item.quantity}
                {(item.checkedQty || 0) > 0 && (
                  <span className="ml-1 inline-flex items-center">
                    {item.checkedQty !== parseFloat(item.quantity || "0") && `(${item.checkedQty})`}
                    <Check size={12} className="ml-0.5" strokeWidth={4} />
                  </span>
                )}
              </div>
              <div className="col-span-2 text-right tracking-tight">{item.price}</div>
              <div className="col-span-2 text-right tracking-tight">
                {paisaToRupees(item.totalPrice)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="py-1 text-right">
        <span className="text-xs font-semibold">SubTotal: </span>
        <span className="text-xs font-semibold">{subtotal}</span>
      </div>
      <div className="mb-8 text-right">
        <span className="text-base font-semibold">Total: </span>
        <span className="text-lg font-semibold">{grandTotal}</span>
        <div className="pb-4 text-center">Thank You</div>
      </div>
      {/* <div className="break-after-page"></div> */}
      {/* <div className="py-2 text-center">{`*** You Saved ₹ ${calaculateAmtSaved()} ***`}</div> */}
    </div>
  );
}
