import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_HOUR } from "@/constants";
import useTransactionState from "@/hooks/useTransactionState";
import { useSidebarStore } from "@/store/sidebarStore";
import { formatDateObjToHHmmss, formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { Check, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { CustomerNameInput } from "./CustomerInputBox";

const BillingHeader = () => {
  const {
    invoiceNo,
    setInvoiceNo,
    customerContact,
    setCustomerContact,
    billingDate,
    setBillingDate
  } = useTransactionState();

  const [open, setOpen] = useState(false);
  const [tempInvoice, setTempInvoice] = useState<number | null>(invoiceNo);
  const [editInvoice, setEditInvoice] = useState<boolean>(false);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  const location = useLocation();
  const page = location.pathname.split("/")[1];
  const { id } = useParams();

  useEffect(() => {
    async function getLatestInvoiceNumber() {
      if (id) return;

      try {
        setInvoiceNo(null);
        let response;
        page === "sales"
          ? (response = await window.salesApi.getNextInvoiceNo())
          : (response = await window.estimatesApi.getNextEstimateNo());
        if (response.status === "success") {
          setInvoiceNo(response.data);
        } else {
          setInvoiceNo(null);
        }
      } catch (error) {
        console.log(error);
      }
    }
    getLatestInvoiceNumber();
  }, [setInvoiceNo, id, page, location]);

  const handleTimeChange = (e) => {
    const [hours, minutes] = e.target.value.split(":");
    const udpatedDate = new Date(billingDate);
    udpatedDate.setHours(hours);
    udpatedDate.setMinutes(minutes);
    setBillingDate(udpatedDate);
  };

  const handleDateChange = (date: Date) => {
    const now = new Date();
    const selectedDate = new Date(date);

    setBillingDate(date);
    const isToday =
      selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth();

    if (isToday) {
      selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    } else {
      selectedDate.setHours(DEFAULT_HOUR, 0, 0, 0);
    }

    setBillingDate(selectedDate);
    setOpen(false);
  };

  return (
    <>
      <div className="border-border mx-5 my-6 flex flex-col justify-center gap-5 rounded-xl border px-6 py-6 shadow-xl">
        <div className="flex items-start justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                  setIsSidebarPinned(true);
                }}
                className="border-border text-foreground hover:b rounded-lg border px-2 py-2 shadow-lg hover:cursor-pointer hover:bg-neutral-200/80"
              >
                <PanelLeftOpen size={23} />
              </button>
              <h1 className="text-3xl font-bold">{page.charAt(0).toUpperCase() + page.slice(1)}</h1>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-muted-foreground text-lg font-medium">Invoice Number</span>
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
          <div className="flex items-center gap-5">
            <div>
              <Label className="text-muted-foreground text-lg">Date</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-36 justify-start bg-transparent text-left text-lg font-normal"
                  >
                    {formatDateObjToStringMedium(billingDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={billingDate}
                    onSelect={(date) => {
                      if (!date) return;
                      handleDateChange(date);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="time-picker" className="px-1 text-lg">
                Time
              </Label>
              <Input
                type="time"
                id="time-picker"
                step="60"
                value={formatDateObjToHHmmss(billingDate)}
                onChange={(e) => handleTimeChange(e)}
                className="bg-background appearance-none !text-lg [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>
        </div>
        <div className="flex max-w-4xl items-center">
          <div className="flex w-full flex-1 items-center gap-4">
            <CustomerNameInput />
            <div className="w-full">
              <label htmlFor="customer-contact" className="text-lg font-medium text-gray-700">
                Customer Phone Number
              </label>

              <div className="relative mt-1">
                <div className="border-r-border pointer-events-none absolute inset-y-0 left-0 flex items-center rounded-l-md border border-gray-300 bg-gray-50 px-3">
                  <span className="text-lg text-gray-500">+91</span>
                </div>

                <Input
                  id="customer-contact"
                  className="py-6 pl-16 !text-lg font-medium focus:border-none"
                  placeholder="Contact Number"
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
