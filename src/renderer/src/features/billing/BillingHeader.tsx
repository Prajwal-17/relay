import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_HOUR } from "@/constants";
import useTransactionState from "@/hooks/useTransactionState";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { formatDateObjToHHmmss, formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { useQuery } from "@tanstack/react-query";
import { Check, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { Navigate, useParams } from "react-router-dom";
import { CustomerNameInput } from "./CustomerInputBox";

const getLatestTransactionNo = async (type: TransactionType) => {
  console.log("header", type);
  try {
    let response;
    if (type === TRANSACTION_TYPE.SALE) {
      response = await window.salesApi.getNextInvoiceNo();
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      response = await window.estimatesApi.getNextEstimateNo();
    } else {
      throw new Error("Transaction Type is undefined");
    }
    if (response.status === "success") {
      return response;
    }
    throw new Error(response.error.message);
  } catch (error) {
    console.log(error);
    throw new Error((error as Error).message);
  }
};

const BillingHeader = () => {
  const {
    transactionNo,
    setTransactionNo,
    customerContact,
    setCustomerContact,
    isNewCustomer,
    billingDate,
    setBillingDate
  } = useTransactionState();

  const [open, setOpen] = useState(false);
  const [tempTransactionNo, setTempTransactionNo] = useState<number | null>(transactionNo);
  const [editInvoice, setEditInvoice] = useState<boolean>(false);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);
  const isDropdownOpen = useSearchDropdownStore((state) => state.isDropdownOpen);

  const { type, id } = useParams<{ type: TransactionType; id?: string }>();

  const { data, isFetched, isError, error } = useQuery({
    queryKey: [type, "getTransactionNo"],
    // null assertion - type cannot be null here
    queryFn: () => getLatestTransactionNo(type!),
    enabled: !id && (type === TRANSACTION_TYPE.SALE || type === TRANSACTION_TYPE.ESTIMATE)
  });

  useEffect(() => {
    if (!isFetched && !data) {
      return;
    }
    setTransactionNo(data.data);
  }, [data, setTransactionNo, isFetched]);

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") return;
    const [hoursString, minutesString] = e.target.value.split(":");

    const hours = parseInt(hoursString, 10);
    const minutes = parseInt(minutesString, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return;
    }
    const udpatedDate = new Date(billingDate);
    udpatedDate.setHours(hours);
    udpatedDate.setMinutes(minutes);
    setBillingDate(udpatedDate);
    localStorage.setItem("bill-preview-date", udpatedDate.toISOString());
  };

  const handleDateChange = (date: Date) => {
    const now = new Date();
    const selectedDate = new Date(date);

    setBillingDate(date);
    localStorage.setItem("bill-preview-date", selectedDate.toISOString());
    const isToday =
      selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth();

    if (isToday) {
      selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    } else {
      selectedDate.setHours(DEFAULT_HOUR, 0, 0, 0);
    }

    setBillingDate(selectedDate);
    localStorage.setItem("bill-preview-date", selectedDate.toISOString());
    setOpen(false);
  };

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  return (
    <>
      <div className="border-border bg-background mx-5 mb-3 flex flex-col justify-center gap-2 rounded-xl border px-4 py-4 shadow-md">
        <div className="flex items-start justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                  setIsSidebarPinned(true);
                }}
                className="border-border text-foreground hover:bg-accent cursor-pointer rounded-lg border px-2 py-2 shadow-lg"
              >
                <PanelLeftOpen size={23} />
              </button>
              <h1 className="text-3xl font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}</h1>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-muted-foreground text-lg font-medium">Invoice Number</span>
              <span className="text-bold text-foreground text-3xl font-semibold">#</span>
              {editInvoice ? (
                <>
                  <Input
                    type="number"
                    className="text-primary w-24 px-1 py-1 text-center !text-xl font-extrabold"
                    value={Number(tempTransactionNo)}
                    onChange={(e) => setTempTransactionNo(Number(e.target.value))}
                  />
                  <Check
                    onClick={() => {
                      setEditInvoice(false);
                      setTransactionNo(tempTransactionNo);
                    }}
                    className="cursor-pointer rounded-md p-1 text-green-600 hover:bg-neutral-200"
                    size={30}
                  />
                  <X
                    className="cursor-pointer rounded-md p-1 text-red-500 hover:bg-neutral-200"
                    onClick={() => {
                      setTempTransactionNo(transactionNo);
                      setEditInvoice(false);
                    }}
                    size={30}
                  />
                </>
              ) : (
                <span className="text-foreground text-3xl font-extrabold">{transactionNo}</span>
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
              <Label htmlFor="time-picker" className="text-muted-foreground px-1 text-lg">
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
        <div className="flex max-w-4xl flex-col justify-between">
          <div className="flex w-full flex-1 items-center gap-4">
            <CustomerNameInput />
            <div className="w-full">
              <label htmlFor="customer-contact" className="text-foreground text-lg font-medium">
                Customer Phone Number
              </label>

              <div className="relative mt-1">
                <div className="border-r-border border-border bg-secondary/80 pointer-events-none absolute inset-y-0 left-0 flex items-center rounded-l-md border px-3">
                  <span className="text-muted-foreground text-lg">+91</span>
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
          <span className="bg-success text-success-foreground my-1 self-start rounded-md px-2 font-medium">
            {isNewCustomer && !isDropdownOpen ? "New Customer" : null}
          </span>
        </div>
      </div>
    </>
  );
};

export default BillingHeader;
