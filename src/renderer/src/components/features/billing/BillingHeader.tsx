import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBillingStore } from "@/store/billingStore";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DateTime } from "./DateTime";

const BillingHeader = () => {
  const invoiceNo = useBillingStore((state) => state.invoiceNo);
  const setInvoiceNo = useBillingStore((state) => state.setInvoiceNo);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const customerContact = useBillingStore((state) => state.customerContact);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);

  const [tempInvoice, setTempInvoice] = useState<number | null>(invoiceNo);
  const [editInvoice, setEditInvoice] = useState<boolean>(false);

  const location = useLocation();
  const page = location.pathname.split("/")[1];

  useEffect(() => {
    async function getLatestInvoiceNumber() {
      try {
        const response = await window.salesApi.getNextInvoiceNo();
        if (response.status === "success") {
          setInvoiceNo(response.data);
        } else {
          console.log(response.error.message);
        }
      } catch (error) {
        console.log(error);
      }
    }
    getLatestInvoiceNumber();
  }, [setInvoiceNo]);

  return (
    <>
      <div className="border-b-border flex w-full flex-col justify-center gap-10 border px-4 py-5">
        <div className="flex items-center justify-between gap-5 px-2 py-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="default" size="lg" className="text-lg font-medium">
                  Home
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{page.charAt(0).toUpperCase() + page.slice(1)}</h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground text-base font-medium">Invoice Number</span>
              <span className="text-bold text-primary text-3xl font-semibold">#</span>
              {editInvoice ? (
                <>
                  <Input
                    type="number"
                    className="text-primary w-24 px-1 py-1 text-center !text-xl font-extrabold"
                    value={Number(tempInvoice)}
                    onChange={(e) => setTempInvoice(Number(e.target.value))}
                  />
                  <Check
                    onClick={() => {
                      setEditInvoice(false);
                      setInvoiceNo(tempInvoice);
                    }}
                    className="cursor-pointer rounded-md p-1 text-green-600 hover:bg-neutral-200"
                    size={30}
                  />
                  <X
                    className="cursor-pointer rounded-md p-1 text-red-500 hover:bg-neutral-200"
                    onClick={() => {
                      setTempInvoice(invoiceNo);
                      setEditInvoice(false);
                    }}
                    size={30}
                  />
                </>
              ) : (
                <span className="text-primary text-3xl font-extrabold">{invoiceNo}</span>
              )}
              {/*<SquarePen size={20} onClick={() => setEditInvoice(true)} />*/}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <DateTime />
          </div>
        </div>
        <div className="flex max-w-4xl items-center">
          <div className="flex w-full flex-1 items-center gap-4">
            <div className="w-full">
              <label htmlFor="customer-name" className="text-lg font-medium text-gray-700">
                Customer Name
              </label>
              <Input
                placeholder="Enter Name"
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="w-full">
              <label htmlFor="customer-contact" className="text-lg font-medium text-gray-700">
                Customer Phone Number
              </label>

              <div className="relative mt-1">
                <div className="border-r-border pointer-events-none absolute inset-y-0 left-0 flex items-center rounded-l-md border border-gray-300 bg-gray-50 px-3">
                  <span className="text-gray-500 sm:text-sm">+91</span>
                </div>

                <Input
                  type="number"
                  id="customer-contact"
                  className="py-2 pl-16"
                  placeholder="Contact Number"
                  // @ts-ignore
                  value={customerContact ?? ""}
                  onChange={(e) => setCustomerContact(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingHeader;
