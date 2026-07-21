import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TimePicker,
  TimePickerContent,
  TimePickerHour,
  TimePickerInput,
  TimePickerInputGroup,
  TimePickerMinute,
  TimePickerPeriod,
  TimePickerSeparator,
  TimePickerTrigger
} from "@/components/ui/time-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_HOUR } from "@/constants";
import { useCustomer } from "@/hooks/customers/useCustomer";
import { apiClient } from "@/lib/apiClient";
import { billingCoordinator } from "@/store/billing/billingCoordinator";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { MAX_BILLING_TABS, useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { type TransactionType } from "@shared/types";
import { formatDateObjToHHmmss, formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Copy, MoreVertical, PanelLeftOpen, Trash2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CustomerNameInput } from "./CustomerInputBox";

const BillingHeader = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updateField = useBillingSessionStore((state) => state.updateField);

  const [open, setOpen] = useState(false);
  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const isSidebarPinned = useSidebarStore((state) => state.isSidebarPinned);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  const { type, id } = useParams<{ type: TransactionType; id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const billingDate = session?.billingDate ?? new Date();
  const transactionNo = session?.transactionNo ?? null;
  const customerName = session?.customerName ?? "";

  const handleDelete = async () => {
    if (!id || !type || !activeTabId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/${type}/${id}`);
      toast.success(`Successfully deleted ${type.slice(0, -1)}`);

      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      queryClient.removeQueries({ queryKey: [type.slice(0, -1), id, activeTabId] });

      // remove tab from store
      const newActiveId = billingCoordinator.removeTab(activeTabId);
      if (newActiveId) {
        const next = useBillingTabsStore.getState().tabs.find((t) => t.id === newActiveId);
        if (next) navigate(next.routePath);
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete transaction");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id || !type) return;

    // check tab limit
    const tabsCount = useBillingTabsStore.getState().tabs.length;
    if (tabsCount >= MAX_BILLING_TABS) {
      toast.error("Cannot duplicate: Maximum number of tabs reached.");
      return;
    }

    setIsDuplicating(true);
    try {
      const response = await apiClient.post<{ id: string }>(`/api/${type}/${id}/duplicate`);
      toast.success(`Successfully duplicated ${type.slice(0, -1)}`);

      queryClient.invalidateQueries({ queryKey: [type], exact: false });

      // open in a new tab
      navigate(`/billing/${type}/${response.id}/edit`);
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate transaction");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleTimeChange = (value: string) => {
    if (!value) return;
    const [hoursString = "", minutesString = ""] = value.split(":");

    const hours = parseInt(hoursString, 10);
    const minutes = parseInt(minutesString, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return;
    }
    const udpatedDate = new Date(billingDate);
    udpatedDate.setHours(hours, minutes, 0, 0);
    localStorage.setItem("bill-preview-date", udpatedDate.toISOString());
    updateField(activeTabId, "billingDate", udpatedDate);
    if (activeTabId) processSyncQueue(activeTabId);
  };

  const handleDateChange = (date: Date) => {
    const now = new Date();
    const selectedDate = new Date(date);

    updateField(activeTabId, "billingDate", date);
    localStorage.setItem("bill-preview-date", selectedDate.toISOString());
    const isToday =
      selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth();

    if (isToday) {
      selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    } else {
      selectedDate.setHours(DEFAULT_HOUR, 0, 0, 0);
    }

    updateField(activeTabId, "billingDate", selectedDate);
    localStorage.setItem("bill-preview-date", selectedDate.toISOString());
    if (activeTabId) processSyncQueue(activeTabId);
    setOpen(false);
  };

  const { customer } = useCustomer(session?.customerId ?? undefined);
  const outstandingBalance = customer?.outstandingBalance ?? 0;
  const isDue = outstandingBalance > 0;

  if (!type) {
    return <Navigate to="/not-found" />;
  }
  if (!activeTabId || !session) return null;

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
                className="hover:bg-accent text-muted-foreground hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150"
              >
                <PanelLeftOpen size={22} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
          </Tooltip>

          <div className="flex items-baseline gap-2.5">
            <span className="text-foreground text-lg font-bold tracking-tight">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            <span className="text-muted-foreground/40 text-xl font-light">/</span>
            <span className="text-foreground font-mono text-2xl font-extrabold tracking-tight tabular-nums">
              #{transactionNo ?? "New"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-muted/60 border-border/50 flex items-center rounded-xl border p-1.5">
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

            <TimePicker
              value={formatDateObjToHHmmss(billingDate)}
              onValueChange={handleTimeChange}
              locale="en-US"
            >
              <TimePickerInputGroup
                className="hover:bg-background h-9 w-auto cursor-pointer gap-1.5 rounded-lg border-none bg-transparent px-2.5 shadow-none transition-colors"
                style={
                  {
                    "--time-picker-hour-input-width": "2.5ch",
                    "--time-picker-minute-input-width": "2.5ch"
                  } as CSSProperties
                }
              >
                <TimePickerInput segment="hour" className="text-base font-medium" />
                <TimePickerSeparator className="text-muted-foreground" />
                <TimePickerInput segment="minute" className="text-base font-medium" />
                <TimePickerInput segment="period" className="text-base font-medium" />
                <TimePickerTrigger className="text-muted-foreground/70 hover:text-foreground ml-1 shrink-0" />
              </TimePickerInputGroup>
              <TimePickerContent align="end">
                <TimePickerHour />
                <TimePickerMinute />
                <TimePickerPeriod />
              </TimePickerContent>
            </TimePicker>
          </div>

          {id && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-border/60 hover:bg-accent text-foreground flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl"
                  >
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                    className="cursor-pointer gap-2 py-2 text-base font-semibold"
                  >
                    <Copy size={16} />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive cursor-pointer gap-2 py-2 text-base font-semibold"
                  >
                    <Trash2 size={16} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      This will permanently delete this transaction from the database and close the
                      tab.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground/80 ml-1 text-xs font-semibold tracking-wider uppercase">
          Customer Details
        </span>
        <div className="flex items-center gap-3">
          <CustomerNameInput />
          {hasRealCustomer && (
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                isDue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              }`}
            >
              {isDue ? `Due ${formatRupee(outstandingBalance)}` : "Settled"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingHeader;
