import type { Calendar } from "@/components/ui/calendar";
import { useDashboardStore } from "@/store/dashboardStore";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

const getInitialDate = (): DateRange => {
  const storedDate = localStorage.getItem("daterange");
  if (storedDate) {
    const parsed = JSON.parse(storedDate);
    return { from: new Date(parsed.from), to: new Date(parsed.to) };
  }

  // Default to today
  const from = new Date();
  const to = new Date();
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return { from, to };
};

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

  // Ref -> https://daypicker.dev/api/enumerations/UI
  const calendarClassNames = {
    month: "space-y-4",
    table: "w-full border-collapse space-y-1",
    month_caption: "flex justify-center items-center gap-2 text-lg font-semibold",
    caption_label: "text-lg flex items-center px-1 gap-1 font-semibold",
    dropdowns: "flex gap-2 items-center",
    dropdown_month: "px-2 py-1 rounded-md border text-lg font-semibold",
    dropdown_year: "px-2 py-1 rounded-md border text-lg font-semibold",
    weekdays: "flex",
    weekday: "text-foreground rounded-md w-10 font-semibold text-[1rem] text-center",
    week: "flex w-full mt-2",
    day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
    day_button:
      "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[range-start=true]:bg-primary data-[range-end=true]:bg-primary",
    day_today: "bg-accent text-accent-foreground font-semibold",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_hidden: "invisible"
  };

  const formatters = {
    formatWeekdayName: (date: Date, options) => {
      const weekDayName = new Intl.DateTimeFormat(options.locale, { weekday: "long" }).format(date);
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

  const handleOnDateSelect = (range) => {
    setSelectedPreset("");

    if (range?.to) {
      const endofDay = new Date(range.to);
      endofDay.setHours(23, 59, 59, 999);
      setTempDate({
        ...range,
        to: endofDay
      });
    } else {
      setTempDate(range);
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
    calendarClassNames,
    formatters,
    handleApplyDateRange,
    handleCancel,
    handleOnDateSelect
  };
};
