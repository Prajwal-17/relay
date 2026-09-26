import type { LedgerMonth } from "@/lib/format/dates";
import type { LocalDate } from "./money.types";

export const moneyKeys = {
  all: ["money"] as const,
  overview: (month: LedgerMonth, date: LocalDate) =>
    ["money", "overview", month.year, month.month, date] as const,
  day: (date: LocalDate) => ["money", "day", date] as const,
  paymentMethods: (includeArchived: boolean) =>
    ["money", "payment-methods", includeArchived] as const,
  receivedEntries: (date: LocalDate, paymentMethodId: number | null) =>
    ["money", "received-entries", date, paymentMethodId ?? "cash"] as const,
  vendors: (search: string) => ["money", "vendors", search.trim().toLowerCase()] as const
};
