import type { Calendar } from "@/components/ui/calendar";
import { useDashboardStore } from "@/store/dashboardStore";
import type { DateRangeType } from "@shared/types";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

export const useDateRangePicker = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(InitialDate());
  const sortBy = useDashboardStore((state) => state.sortBy);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(InitialDate());
  const setSales = useDashboardStore((state) => state.setSales);
  const setEstimates = useDashboardStore((state) => state.setEstimates);
  const previousDate = useRef(date);
  const dropdown: React.ComponentProps<typeof Calendar>["captionLayout"] = "dropdown";

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  function InitialDate() {
    const startofDay = new Date();
    const endofDay = new Date();
    startofDay.setHours(0, 0, 0, 0);
    endofDay.setHours(23, 59, 59, 999);

    return {
      from: startofDay,
      to: endofDay
    };
  }

  useEffect(() => {
    const dateRange = localStorage.getItem("daterange");

    if (!dateRange) {
      setDate(InitialDate());
      setTempDate(InitialDate());
      localStorage.setItem("daterange", JSON.stringify(InitialDate()));
      return;
    }
    const parsedDateRange = JSON.parse(dateRange!);
    const fromDate = new Date(parsedDateRange.from);
    const toDate = new Date(parsedDateRange.to);

    setDate({
      from: fromDate,
      to: toDate
    });

    setTempDate({
      from: fromDate,
      to: toDate
    });

    const presetType = localStorage.getItem("preset-type");
    setSelectedPreset(presetType || "");
  }, []);

  useEffect(() => {
    async function fetchSales() {
      if (!date) return;
      try {
        const response = await window.salesApi.getSalesDateRange(date as DateRangeType, sortBy);
        if (response.status === "success") {
          setSales(response.data);
        } else {
          toast.error("Could not retrieve sales");
        }
      } catch (error) {
        console.log(error);
      }
    }

    async function fetchEstimates() {
      if (!date) return;
      try {
        const response = await window.estimatesApi.getEstimatesDateRange(
          date as DateRangeType,
          sortBy
        );
        if (response.status === "success") {
          setEstimates(response.data);
        } else {
          toast.error("Could not retrieve estimates");
        }
      } catch (error) {
        console.log(error);
      }
    }
    if (
      !open &&
      (date?.from !== previousDate.current?.from || date?.from !== previousDate.current?.to)
    ) {
      if (pathname === "/sale") {
        fetchSales();
      } else {
        fetchEstimates();
      }

      previousDate.current = date;
    }
    if (pathname === "/sale") {
      fetchSales();
    } else {
      fetchEstimates();
    }
  }, [date, sortBy, open, pathname, setSales, setEstimates]);

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
