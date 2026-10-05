import { getTodayIST, isValidCalendarDate } from "@relay/shared/date-utils";
export { isValidCalendarDate } from "@relay/shared/date-utils";

export function nowIso(): string {
  return new Date().toISOString();
}

export const todayInIndia = getTodayIST;

export function isValidLedgerDate(value: string): boolean {
  return isValidCalendarDate(value) && value <= todayInIndia();
}
