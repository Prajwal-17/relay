import type { LocalDate, LedgerMonth, CalendarDay } from "@/types/date.types";
export type { LocalDate, LedgerMonth, CalendarDay } from "@/types/date.types";

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

export function shiftMonth(value: LedgerMonth, amount: number): LedgerMonth {
  const shifted = new Date(Date.UTC(value.year, value.month + amount, 1, 12));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() };
}

export function monthKey(value: LedgerMonth): string {
  return `${value.year}-${String(value.month + 1).padStart(2, "0")}`;
}

export function monthLabel(value: LedgerMonth): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(value.year, value.month, 1, 12)));
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

export function buildCalendarMonth(value: LedgerMonth): (CalendarDay | null)[] {
  const firstDay = new Date(Date.UTC(value.year, value.month, 1, 12)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(value.year, value.month + 1, 0, 12)).getUTCDate();
  const cells: (CalendarDay | null)[] = Array.from({ length: 42 }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells[firstDay + day - 1] = {
      day,
      date: `${value.year}-${String(value.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` as LocalDate
    };
  }

  return cells;
}

export function isFutureDate(date: LocalDate): boolean {
  return date > getTodayIST();
}

export function isSameMonth(date: LocalDate, month: LedgerMonth): boolean {
  return date.startsWith(monthKey(month));
}
