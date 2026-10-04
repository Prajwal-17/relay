export const INDIA_TIME_ZONE = "Asia/Kolkata";
export type LocalDate = `${number}-${number}-${number}`;
export interface LedgerMonth {
  year: number;
  /** Zero-based calendar month. */
  month: number;
}

const datePartFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: INDIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function getTodayIST(now: Date = new Date()): LocalDate {
  const parts = datePartFormatter.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year"),
    month = value("month"),
    day = value("day");
  if (!year || !month || !day) throw new Error("Unable to determine the current business date.");
  return `${year}-${month}-${day}` as LocalDate;
}

/** Validate a calendar date without allowing Date to roll impossible days forward. */
export function parseLocalDate(value: string | null | undefined): LocalDate | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year! < 1) return null;
  const check = new Date(`${value}T12:00:00.000Z`);
  return check.getUTCFullYear() === year &&
    check.getUTCMonth() === month! - 1 &&
    check.getUTCDate() === day
    ? (value as LocalDate)
    : null;
}

export function isValidCalendarDate(value: string): boolean {
  return parseLocalDate(value) !== null;
}

/** Civil dates use UTC arithmetic; they are never interpreted as device-local instants. */
export function calendarDateToUTC(date: LocalDate): Date {
  return new Date(`${date}T12:00:00.000Z`);
}

export function addCalendarDays(date: LocalDate, days: number): LocalDate {
  const value = calendarDateToUTC(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10) as LocalDate;
}

export function differenceInCalendarDays(later: LocalDate, earlier: LocalDate): number {
  return (calendarDateToUTC(later).getTime() - calendarDateToUTC(earlier).getTime()) / 86_400_000;
}

export function calendarWeekday(date: LocalDate): number {
  return calendarDateToUTC(date).getUTCDay();
}

export function monthFromDate(date: LocalDate): LedgerMonth {
  const [year, month] = date.split("-").map(Number);
  return { year: year!, month: month! - 1 };
}

export function formatDisplayDate(date: LocalDate): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(calendarDateToUTC(date));
}

export function formatDisplayMonth(month: LedgerMonth): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(calendarDateToUTC(monthStart(month)));
}

export function getDisplayDateParts(date: LocalDate): {
  day: string;
  month: string;
  weekday: string;
  year: string;
} {
  const value = calendarDateToUTC(date);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(value);
  return {
    day: format({ day: "numeric" }),
    month: format({ month: "long" }),
    weekday: format({ weekday: "long" }),
    year: format({ year: "numeric" })
  };
}

export function isFutureDate(date: LocalDate, today = getTodayIST()): boolean {
  return date > today;
}

export function businessWeek(date: LocalDate): LocalDate[] {
  const start = addCalendarDays(date, -calendarWeekday(date));
  return Array.from({ length: 7 }, (_, offset) => addCalendarDays(start, offset));
}

export function monthsInWeek(dates: LocalDate[]): LedgerMonth[] {
  return [...new Set(dates.map((date) => date.slice(0, 7)))].map((month) =>
    monthFromDate(`${month}-01` as LocalDate)
  );
}

export function shiftMonth(month: LedgerMonth, offset: number): LedgerMonth {
  const value = calendarDateToUTC(monthStart(month));
  value.setUTCMonth(value.getUTCMonth() + offset);
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() };
}

/** Keep the selected weekday while paging, clamping the current week to today. */
export function shiftBusinessWeek(
  date: LocalDate,
  offset: -1 | 1,
  today = getTodayIST()
): LocalDate {
  if (offset === 1 && businessWeek(date)[0]! >= businessWeek(today)[0]!) return date;
  const next = addCalendarDays(date, offset * 7);
  return next > today ? today : next;
}

export function monthStart(month: LedgerMonth): LocalDate {
  return `${String(month.year).padStart(4, "0")}-${String(month.month + 1).padStart(2, "0")}-01` as LocalDate;
}

/** Desktop contract: timezone-less timestamps are IST; explicit offsets keep their instant. */
export function formatDateStrToISTDateObject(dateStr: string): Date | null {
  if (typeof dateStr !== "string") return null;
  const match =
    /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(
      dateStr
    );
  if (!match || !parseLocalDate(match[1])) return null;
  const [, date, hour = "00", minute = "00", second = "00", fraction = "", timezone] = match;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  const offset = timezone?.replace(/^([+-]\d{2})(\d{2})$/, "$1:$2") ?? "+05:30";
  if (offset !== "Z" && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59))
    return null;
  const value = new Date(
    `${date}T${hour}:${minute}:${second}.${fraction.padEnd(3, "0").slice(0, 3)}${offset}`
  );
  return Number.isNaN(value.getTime()) ? null : value;
}

export function formatDateStr(dateStr?: string): string {
  const date = dateStr ? formatDateStrToISTDateObject(dateStr) : null;
  return date
    ? date.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: INDIA_TIME_ZONE })
    : "-";
}

/** Date picker objects retain the desktop's local wall-clock contract. */
export function formatDateObjToStringMedium(dateObj: Date): string {
  return Number.isNaN(dateObj.getTime())
    ? "-"
    : dateObj.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

/** Historical name retained for callers; the result is HH:mm, without seconds. */
export function formatDateObjToHHmmss(dateObj: Date): string {
  if (Number.isNaN(dateObj.getTime())) return "-";
  return `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
}

export function formatDateStrToISTDateStr(dateStr: string): { fullDate: string; timePart: string } {
  const date = formatDateStrToISTDateObject(dateStr);
  if (!date) return { fullDate: "-", timePart: "-" };
  return {
    fullDate: date.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: INDIA_TIME_ZONE }),
    timePart: date
      .toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: INDIA_TIME_ZONE
      })
      .replace(/\s+/g, " ")
  };
}

export function formatDateStrToISTDateTimeStr(dateStr: string): string {
  const { fullDate, timePart } = formatDateStrToISTDateStr(dateStr);
  return fullDate === "-" ? "-" : `${fullDate} ${timePart}`;
}

export function isWithinTwoDays(createdAt: string): boolean {
  const date = formatDateStrToISTDateObject(createdAt);
  return date !== null && Date.now() - date.getTime() <= 48 * 60 * 60 * 1000;
}
