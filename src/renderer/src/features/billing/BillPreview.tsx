import { Button } from "@/components/ui/button";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import useTransactionState from "@/hooks/useTransactionState";
import { useLocation } from "react-router-dom";

const BillPreview = () => {
  const location = useLocation();
  const type = location.pathname.split("/")[1];

  const { lineItems, invoiceNo, customerName } = useTransactionState();
  const { receiptRef, calcTotalAmount, handleAction } = useTransactionActions(
    type === "sales" ? "sales" : "estimates"
  );

  const IndianRupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  });

  return (
    <>
      <div className="flex w-1/4 flex-col items-center justify-between overflow-y-auto border border-green-500 bg-neutral-100">
        <div
          ref={receiptRef}
          className="receipt no-break font-roboto mt-0 mb-24 border border-green-500 bg-white px-1 pt-1 text-black"
        >
          <div className="mb-2 space-y-2 pb-4 text-center">
            <h1 className="text-lg font-bold tracking-tight">SRI MANJUNATHESHWARA STORES</h1>
            <p className="text-xs">6TH MAIN, RUKMINI NAGAR NAGASANDRA POST BANGALORE 560073</p>
            {type === "sales" && (
              <p className="text-xs">
                <span className="font-semibold">GSTIN:</span>29BHBPR8333N2ZM
              </p>
            )}
            <p className="text-xs">
              <span className="font-semibold">Ph.No.:</span>
              9945029729
            </p>
          </div>
          <div className="mb-4 flex justify-between border-t border-b border-dashed border-black py-1 text-xs">
            <div>
              <div>
                <span className="font-semibold">Date:</span>{" "}
                {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </div>
              <div>
                <span className="font-semibold">
                  {type === "sales" ? "Invoice No:" : "Estimate No:"}
                </span>{" "}
                {invoiceNo}
              </div>
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {customerName === "DEFAULT" || customerName === ""
                  ? type === "sales"
                    ? "Sale"
                    : "Estimate"
                  : customerName}
              </div>
            </div>
            <div>
              <span className="font-semibold">Time:</span>{" "}
              {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-dashed border-black pb-1 text-xs font-bold">
            <div className="col-span-1">#</div>
            <div className="col-span-3">ITEM</div>
            <div className="col-span-2 text-center">QTY</div>
            <div className="col-span-3 text-right">RATE</div>
            <div className="col-span-3 text-right">AMT</div>
          </div>
          <div className="border-b border-dashed border-black text-xs font-medium">
            {lineItems.map((item, idx) => {
              if (item.name === "") return;
              return (
                <div key={idx} className="grid grid-cols-12 py-1">
                  <div className="col-span-1">{idx + 1}.</div>
                  <div className="col-span-5">{item.name}</div>
                  <div className="col-span-2 text-center tracking-tight">{item.quantity}</div>
                  <div className="col-span-2 text-right tracking-tight">
                    {item.price.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right tracking-tight">
                    {item.totalPrice.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="py-1 text-right">
            <span className="text-xs font-semibold">SubTotal: </span>
            <span className="text-xs font-semibold">{calcTotalAmount.toFixed(2)}</span>
          </div>
          <div className="mb-8 text-right">
            <span className="text-base font-semibold">Total: </span>
            <span className="text-lg font-semibold">
              {IndianRupees.format(Math.round(calcTotalAmount))}
            </span>
            <div className="pb-4 text-center">Thank You</div>
          </div>
          {/* <div className="break-after-page"></div> */}
          {/* <div className="py-2 text-center">{`*** You Saved ₹ ${calaculateAmtSaved()} ***`}</div> */}
          <div className="h-12"></div>
        </div>
        <div className="flex w-1/4">
          <Button className="" onClick={() => handleAction("save")}>
            Save
          </Button>
          <Button onClick={() => handleAction("save&print")}>Print</Button>
        </div>
      </div>
    </>
  );
};

export default BillPreview;
