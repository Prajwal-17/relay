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
import { DEFAULT_HOUR } from "@/constants/renderer.constants";
import { useCustomer } from "@/features/customers/hooks/useCustomer";
import { apiClient } from "@/lib/apiClient";
import { billingCoordinator } from "@/features/billing/store/billingCoordinator";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { MAX_BILLING_TABS, useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { usePreviewTabStore } from "@/features/billing/store/previewTab.store";
import { processSyncQueue } from "@/features/billing/syncWorker";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { formatDateObjToHHmmss, formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Copy, MoreVertical, PanelRightOpen, Trash2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CustomerNameInput } from "./CustomerInputBox";
import SaleAccountControl from "./SaleAccountControl";

const BillingHeader = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updateField = useBillingSessionStore((state) => state.updateField);

  const [open, setOpen] = useState(false);
  const isPreviewOpen = usePreviewTabStore((state) => state.isPanelOpen);
  const setPreviewOpen = usePreviewTabStore((state) => state.setPanelOpen);

  const { type, id } = useParams<{ type: DashboardType; id?: string }>();
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
  const customerType =
    customer?.customerType ?? (!session?.customerId && customerName ? "cash" : null);
  const outstandingBalance = customer?.outstandingBalance ?? 0;
  const isDue = outstandingBalance > 0;

  if (!type) {
    return <Navigate to="/not-found" />;
  }
  if (!activeTabId || !session) return null;

  const hasRealCustomer = customerName && customerName !== "DEFAULT" && customerName !== "";

  return (
    <section className="bg-card border-frame mx-3 mt-2 shrink-0 rounded-(--radius-panel) border px-3 py-2">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span
            className={
              type === DASHBOARD_TYPE.SALES
                ? "text-success text-base font-bold"
                : "text-info text-base font-bold"
            }
          >
            {type === DASHBOARD_TYPE.SALES ? "Sale" : "Estimate"}
          </span>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-foreground truncate text-lg font-bold tabular-nums">
            #{transactionNo ?? "New"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="bg-muted border-border flex items-center rounded-(--radius-control) border p-0.5">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-transparent px-2 text-sm font-medium"
                >
                  <CalendarDays className="text-muted-foreground" />
                  {formatDateObjToStringMedium(billingDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={billingDate}
                  onSelect={(date) => {
                    if (date) handleDateChange(date);
                  }}
                />
              </PopoverContent>
            </Popover>

            <div className="bg-border h-5 w-px shrink-0" />

            <TimePicker
              value={formatDateObjToHHmmss(billingDate)}
              onValueChange={handleTimeChange}
              locale="en-US"
            >
              <TimePickerInputGroup
                className="h-8 w-auto cursor-pointer gap-1 rounded-(--radius-control) border-none bg-transparent px-2 shadow-none"
                style={
                  {
                    "--time-picker-hour-input-width": "2.5ch",
                    "--time-picker-minute-input-width": "2.5ch"
                  } as CSSProperties
                }
              >
                <TimePickerInput segment="hour" className="text-sm font-medium" />
                <TimePickerSeparator className="text-muted-foreground" />
                <TimePickerInput segment="minute" className="text-sm font-medium" />
                <TimePickerInput segment="period" className="text-xs font-medium" />
                <TimePickerTrigger className="text-muted-foreground ml-0.5 shrink-0" />
              </TimePickerInputGroup>
              <TimePickerContent align="end" className="max-w-none">
                <TimePickerHour />
                <TimePickerMinute />
                <TimePickerPeriod />
              </TimePickerContent>
            </TimePicker>
          </div>

          <Button
            type="button"
            variant={isPreviewOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setPreviewOpen(!isPreviewOpen)}
            className="gap-1.5 px-2.5 text-xs"
          >
            <PanelRightOpen />
          </Button>

          {id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Transaction actions">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                  <Copy />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="mt-2 flex min-w-0 items-end gap-2">
        <div className="w-full max-w-xl min-w-56 flex-1">
          <span className="text-muted-foreground mb-1 block text-xs font-semibold">
            Customer details
          </span>
          <CustomerNameInput customerType={customerType} />
        </div>
        {hasRealCustomer && (
          <span
            className={
              isDue
                ? "bg-destructive/10 text-destructive mb-0.5 shrink-0 rounded-(--radius-control) px-2.5 py-1.5 text-xs font-semibold tabular-nums"
                : "bg-muted text-muted-foreground mb-0.5 shrink-0 rounded-(--radius-control) px-2.5 py-1.5 text-xs font-semibold"
            }
          >
            {isDue ? "Due " + formatRupee(outstandingBalance) : "Settled"}
          </span>
        )}
        <SaleAccountControl />
      </div>

      {id && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the transaction and closes its billing tab.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground"
              >
                {isDeleting ? "Deleting..." : "Delete transaction"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  );
};

export default BillingHeader;
