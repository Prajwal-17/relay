import type { Calendar } from "@/components/ui/calendar";
import { useDashboardStore } from "@/features/transactions/store/dashboard.store";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

export const useDateRangePicker = () => {
  const [open, setOpen] = useState(false);
  const date = useDashboardStore((state) => state.date);
  const setDate = useDashboardStore((state) => state.setDate);
  const tempDate = useDashboardStore((state) => state.tempDate);
  const setTempDate = useDashboardStore((state) => state.setTempDate);
  const dropdown: React.ComponentProps<typeof Calendar>["captionLayout"] = "dropdown";

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (date) {
      localStorage.setItem("daterange", JSON.stringify(date));
    }
  }, [date]);

  const formatters = {
    formatWeekdayName: (date: Date, options?: { locale?: Intl.LocalesArgument }) => {
      const weekDayName = new Intl.DateTimeFormat(options?.locale, { weekday: "long" }).format(
        date
      );
      return weekDayName.charAt(0);
    }
  };

  const handleApplyDateRange = () => {
    setDate(tempDate);
    localStorage.setItem("daterange", JSON.stringify({ from: tempDate?.from, to: tempDate?.to }));
    if (selectedPreset) {
      localStorage.setItem("preset-type", selectedPreset);
    } else {
      localStorage.removeItem("preset-type");
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setTempDate(date);
    setSelectedPreset(localStorage.getItem("preset-type") || null);
  };

  const handleOnDateSelect = (range: DateRange) => {
    setSelectedPreset("");

    if (range?.from && range?.to) {
      const endofDay = new Date(range.to);
      endofDay.setHours(23, 59, 59, 999);
      setTempDate({
        from: range.from,
        to: endofDay
      });
    } else if (range?.from) {
      setTempDate({ from: range.from, to: undefined });
    } else {
      setTempDate(undefined);
    }
  };

  return {
    open,
    setOpen,
    date,
    tempDate,
    setTempDate,
    dropdown,
    selectedPreset,
    setSelectedPreset,
    formatters,
    handleApplyDateRange,
    handleCancel,
    handleOnDateSelect
  };
};
