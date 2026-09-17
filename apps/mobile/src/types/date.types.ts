export type LocalDate = `${number}-${number}-${number}`;

export interface LedgerMonth {
  year: number;
  month: number;
}

export interface CalendarDay {
  date: LocalDate;
  day: number;
}
