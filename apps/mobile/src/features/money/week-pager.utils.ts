import {
  addCalendarDays,
  businessWeek,
  calendarWeekday,
  differenceInCalendarDays
} from "@relay/shared/date-utils";
import type { LocalDate } from "./money.types";

/** Page zero is this week. Older weeks keep their index as history grows. */
export function weekPageIndex(date: LocalDate, today: LocalDate): number {
  return Math.max(
    0,
    Math.round(differenceInCalendarDays(businessWeek(today)[0]!, businessWeek(date)[0]!) / 7)
  );
}

export function weekPageStart(today: LocalDate, page: number): LocalDate {
  return addCalendarDays(businessWeek(today)[0]!, -page * 7);
}

export function dateOnWeekPage(today: LocalDate, page: number, selectedDate: LocalDate): LocalDate {
  const date = addCalendarDays(weekPageStart(today, page), calendarWeekday(selectedDate));
  return date > today ? today : date;
}
