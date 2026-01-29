import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_HOUR } from "@/constants";
import { useBillingStore } from "@/store/billingStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { type TransactionType } from "@shared/types";
import { formatDateObjToHHmmss, formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { PanelLeftOpen } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { CustomerNameInput } from "./CustomerInputBox";

const BillingHeader = () => {
  const transactionNo = useBillingStore((state) => state.transactionNo);
  const billingDate = useBillingStore((state) => state.billingDate);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);

  const [open, setOpen] = useState(false);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  const { type } = useParams<{ type: TransactionType; id?: string }>();

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
              <span className="text-foreground text-3xl font-extrabold">{transactionNo}</span>
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
                className="bg-background appearance-none text-lg! [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>
        </div>
        <CustomerNameInput />
      </div>
    </>
  );
};

export default BillingHeader;
