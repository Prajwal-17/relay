import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_HOUR } from "@/constants";
import { useBillingStore } from "@/store/billingStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { type TransactionType } from "@shared/types";
import { formatDateObjToHHmmss, formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { CalendarDays, Clock, PanelLeftOpen, UserRound } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { CustomerNameInput } from "./CustomerInputBox";

const BillingHeader = () => {
  const transactionNo = useBillingStore((state) => state.transactionNo);
  const billingDate = useBillingStore((state) => state.billingDate);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);
  const customerName = useBillingStore((state) => state.customerName);

  const [open, setOpen] = useState(false);
  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const isSidebarPinned = useSidebarStore((state) => state.isSidebarPinned);
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
    localStorage.setItem("bill-preview-date", udpatedDate.toISOString());
    setBillingDate(udpatedDate);
    processSyncQueue();
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
    processSyncQueue();
    setOpen(false);
  };

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  const hasRealCustomer = customerName && customerName !== "DEFAULT" && customerName !== "";

  return (
    <div className="bg-card border-border/60 mx-4 my-2 flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  const nextPinnedState = !(isSidebarOpen && isSidebarPinned);
                  setIsSidebarPinned(nextPinnedState);
                  setIsSidebarOpen(nextPinnedState);
                }}
                className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150"
              >
                <PanelLeftOpen size={22} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
          </Tooltip>

          <div className="flex items-baseline gap-2.5">
            <span className="text-foreground text-xl font-bold tracking-tight">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            <span className="text-muted-foreground/40 text-2xl font-light">/</span>
            <span className="text-foreground font-mono text-3xl font-extrabold tracking-tight tabular-nums">
              #{transactionNo}
            </span>
          </div>
        </div>

        <div className="bg-muted/30 border-border/50 flex items-center rounded-xl border p-1.5">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-background h-9 rounded-lg px-3.5 text-base font-medium"
              >
                <CalendarDays size={16} className="text-muted-foreground/70 mr-2" />
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

          <div className="bg-border/50 mx-1.5 h-6 w-px shrink-0" />

          <div className="hover:bg-background flex h-9 items-center rounded-lg px-2.5 transition-colors">
            <Clock size={16} className="text-muted-foreground/70 mr-2 shrink-0" />
            <Input
              type="time"
              id="time-picker"
              step="60"
              value={formatDateObjToHHmmss(billingDate)}
              onChange={(e) => handleTimeChange(e)}
              className="h-9 w-24 border-none bg-transparent px-1 text-base! font-medium shadow-none focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground/80 ml-1 text-xs font-semibold tracking-wider uppercase">
          Customer Details
        </span>
        <div className="flex items-center gap-3">
          <CustomerNameInput />
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={!hasRealCustomer}
                  className="h-12 gap-2 px-5 text-base font-medium disabled:opacity-50"
                >
                  <UserRound size={18} />
                  View Account
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {hasRealCustomer ? "View customer account" : "Select a customer first"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default BillingHeader;
