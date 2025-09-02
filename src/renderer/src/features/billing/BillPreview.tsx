import { Button } from "@/components/ui/button";
import useTransactionState from "@/hooks/useTransactionState";
import { useRef } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

const BillPreview = () => {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const {
    lineItems,
    setLineItems,
    invoiceNo,
    setInvoiceNo,
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    customerContact,
    setCustomerContact,
    billingId,
    setBillingId
  } = useTransactionState();

  const location = useLocation();
  const type = location.pathname.split("/")[1];

  const handlePrint = useReactToPrint({
    contentRef: receiptRef
  });

  const IndianRupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  });

  const calcTotalAmount = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const calcTotalQuantity = lineItems.reduce((sum, currentItem) => {
    return sum + currentItem.quantity;
  }, 0);

  async function handleSave() {
    try {
      if (type === "sales") {
        const response = await window.salesApi.save({
          billingId: billingId,
          invoiceNo: Number(invoiceNo),
          customerId,
          customerName,
          customerContact,
          grandTotal: calcTotalAmount,
          totalQuantity: calcTotalQuantity,
          isPaid: true,
          items: [...lineItems]
        });
        if (response.status === "success") {
          toast.success("Sale Saved successfully");
          setBillingId("");
          setCustomerId("");
          setInvoiceNo(null);
          setCustomerName("");
          setCustomerContact("");
          setLineItems([]);
          navigate("/");
        } else {
          toast.error(response.error.message);
        }
      } else {
        const response = await window.estimatesApi.save({
          billingId: billingId,
          estimateNo: Number(invoiceNo),
          customerId,
          customerName,
          customerContact,
          grandTotal: calcTotalAmount,
          totalQuantity: calcTotalQuantity,
          isPaid: true,
          items: [...lineItems]
        });
        if (response.status === "success") {
          toast.success("Estimate Saved successfully");
          setBillingId("");
          setCustomerId("");
          setInvoiceNo(null);
          setCustomerName("");
          setCustomerContact("");
          setLineItems([]);
          navigate("/");
        } else {
          toast.error(response.error.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

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
          <Button className="" onClick={handleSave}>
            Save
          </Button>
          <Button
            onClick={() => {
              handleSave();
              handlePrint();
            }}
          >
            Print
          </Button>
        </div>
      </div>
    </>
  );
};

export default BillPreview;
