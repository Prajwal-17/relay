import type { DateRange } from "react-day-picker";

export const calendarPresets = [
  {
    label: "Yesterday",
    value: "yesterday",
    getRange: () => {
      const today = new Date();
      // do not use const fromDate = today, this adds a reference and also mutates today
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 1);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(today);
      toDate.setDate(toDate.getDate() - 1);
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate, to: toDate };
    }
  },
  {
    label: "Today",
    value: "today",
    getRange: () => {
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(today);
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate, to: toDate };
    }
  },
  {
    label: "Last 7 Days",
    value: "last7days",
    getRange: () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);
      return { from: startOfWeek, to: endOfWeek };
    }
  },
  {
    label: "Last 30 Days",
    value: "last30days",
    getRange: () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: startDate, to: endDate };
    }
  },
  {
    label: "Last 90 Days",
    value: "last90days",
    getRange: () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: startDate, to: endDate };
    }
  }
];

export type DatePresetValue = (typeof calendarPresets)[number]["value"];

export const QUICK_DATE_PRESETS = [
  "today",
  "yesterday",
  "last7days"
] as const satisfies readonly DatePresetValue[];
export const SECONDARY_DATE_PRESETS = [
  "last30days",
  "last90days"
] as const satisfies readonly DatePresetValue[];

const sameRange = (left: DateRange | undefined, right: DateRange) =>
  left?.from?.getTime() === right.from?.getTime() && left?.to?.getTime() === right.to?.getTime();

export const getActiveDatePreset = (date: DateRange | undefined): DatePresetValue | null => {
  return calendarPresets.find((preset) => sameRange(date, preset.getRange()))?.value ?? null;
};

export const getDatePreset = (value: DatePresetValue) =>
  calendarPresets.find((preset) => preset.value === value)!;

export const formatTransactionDateRange = (date: DateRange | undefined) => {
  if (!date?.from || !date.to) return "Select dates";

  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const from = formatter.format(date.from);
  const to = formatter.format(date.to);

  return `${from} – ${to}`;
};

export const getDateRangeContext = (date: DateRange | undefined) => {
  switch (getActiveDatePreset(date)) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "last7days":
      return "Last 7 days";
    case "last30days":
      return "Last 30 days";
    case "last90days":
      return "Last 90 days";
    default:
      return formatTransactionDateRange(date);
  }
};
