import type { Calendar } from "@/components/ui/calendar";
import { useDashboardStore } from "@/features/transactions/store/dashboard.store";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export const useDateRangePicker = () => {
  const [open, setOpen] = useState(false);
  const date = useDashboardStore((state) => state.date);
  const setDate = useDashboardStore((state) => state.setDate);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(date);
  const dropdown: React.ComponentProps<typeof Calendar>["captionLayout"] = "dropdown";

  const formatters = {
    formatWeekdayName: (value: Date, options?: { locale?: Intl.LocalesArgument }) => {
      const weekDayName = new Intl.DateTimeFormat(options?.locale, { weekday: "long" }).format(
        value
      );
      return weekDayName.charAt(0);
    }
  };
  const handleOpenChange = (nextOpen: boolean) => {
    setTempDate(date);
    setOpen(nextOpen);
  };

  const handleApplyDateRange = () => {
    if (!tempDate?.from || !tempDate.to) return;
    setDate(tempDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempDate(date);
    setOpen(false);
  };

  const handleOnDateSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      const from = new Date(range.from);
      const to = new Date(range.to);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      setTempDate({
        from,
        to
      });
    } else if (range?.from) {
      const from = new Date(range.from);
      from.setHours(0, 0, 0, 0);
      setTempDate({ from, to: undefined });
    } else {
      setTempDate(undefined);
    }
  };

  return {
    open,
    date,
    setDate,
    tempDate,
    setTempDate,
    dropdown,
    formatters,
    handleApplyDateRange,
    handleOpenChange,
    handleCancel,
    handleOnDateSelect,
    canApply: Boolean(tempDate?.from && tempDate.to)
  };
};
