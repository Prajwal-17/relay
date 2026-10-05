import type { LedgerMonth } from "@/lib/format/dates";
import type { LocalDate } from "./money.types";
import { businessWeek } from "@/lib/format/dates";

export const moneyKeys = {
  all: ["money"] as const,
  summaries: (month: LedgerMonth) => ["money", "summaries", month.year, month.month] as const,
  weeks: ["money", "weeks"] as const,
  week: (date: LocalDate) => {
    const dates = businessWeek(date);
    return ["money", "weeks", { startDate: dates[0]!, endDate: dates[6]! }] as const;
  },
  histories: ["money", "received-history"] as const,
  historiesForDate: (date: LocalDate) => ["money", "received-history", date] as const,
  receivedHistory: (date: LocalDate, paymentMethodId: number | null) =>
    ["money", "received-history", date, paymentMethodId ?? "cash"] as const,
  entry: (kind: "received" | "vendor", id: number) => ["money", "entry", kind, id] as const,
  vendors: ["money", "vendors"] as const
};
