import type { LedgerMonth, LocalDate } from "@/types/date.types";
export type { LedgerMonth, LocalDate } from "@/types/date.types";

const datePartFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function getTodayIST(): LocalDate {
  const parts = datePartFormatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) throw new Error("Unable to determine the current business date.");
  return `${year}-${month}-${day}` as LocalDate;
}

export function parseLocalDate(value: string | undefined): LocalDate | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const check = new Date(Date.UTC(year!, month! - 1, day!, 12));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month! - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return value as LocalDate;
}

export function monthFromDate(date: LocalDate): LedgerMonth {
  const [year, month] = date.split("-").map(Number);
  return { year: year!, month: month! - 1 };
}

export function formatDisplayDate(date: LocalDate): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year!, month! - 1, day!, 12)));
}

export function getDisplayDateParts(date: LocalDate): {
  day: string;
  month: string;
  weekday: string;
  year: string;
} {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year!, month! - 1, day!, 12));
  return {
    day: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      timeZone: "UTC"
    }).format(value),
    month: new Intl.DateTimeFormat("en-IN", {
      month: "long",
      timeZone: "UTC"
    }).format(value),
    weekday: new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      timeZone: "UTC"
    }).format(value),
    year: new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      timeZone: "UTC"
    }).format(value)
  };
}

export function isFutureDate(date: LocalDate): boolean {
  return date > getTodayIST();
}
