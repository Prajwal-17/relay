import { apiRequest } from "@/lib/api/api-client";
import type { LedgerMonth } from "@/lib/format/dates";
import type {
  DailyEntry,
  LocalDate,
  MoneyOverview,
  PaymentMethod,
  PaymentMethodUpdate,
  ReceivedEntry,
  ReceivedPaymentInput,
  VendorPaymentInput
} from "./money.types";

function jsonBody(value: unknown): RequestInit {
  return { body: JSON.stringify(value) };
}

export function getMoneyOverview(
  month: LedgerMonth,
  date: LocalDate,
  signal?: AbortSignal
): Promise<MoneyOverview> {
  const query = new URLSearchParams({
    date,
    year: String(month.year),
    month: String(month.month + 1)
  });
  return apiRequest(`/api/money/overview?${query}`, { signal });
}

export function getDailyEntry(date: LocalDate, signal?: AbortSignal): Promise<DailyEntry | null> {
  return apiRequest(`/api/money/days/${date}`, { signal });
}

export function deleteDailyEntry(date: LocalDate): Promise<void> {
  return apiRequest(`/api/money/days/${date}`, { method: "DELETE" });
}

export function listPaymentMethods(
  includeArchived = false,
  signal?: AbortSignal
): Promise<PaymentMethod[]> {
  return apiRequest(`/api/money/payment-methods?includeArchived=${includeArchived}`, { signal });
}

export function createPaymentMethod(name: string): Promise<PaymentMethod> {
  return apiRequest("/api/money/payment-methods", {
    method: "POST",
    ...jsonBody({ name })
  });
}

export function updatePaymentMethod(
  id: number,
  input: PaymentMethodUpdate
): Promise<PaymentMethod> {
  return apiRequest(`/api/money/payment-methods/${id}`, {
    method: "PATCH",
    ...jsonBody(input)
  });
}

export function addReceivedPayment(input: ReceivedPaymentInput): Promise<void> {
  return apiRequest("/api/money/received-payments", {
    method: "POST",
    ...jsonBody(input)
  });
}

export function addVendorPayment(input: VendorPaymentInput): Promise<void> {
  return apiRequest("/api/money/vendor-payments", {
    method: "POST",
    ...jsonBody(input)
  });
}

export function listReceivedEntries(
  date: LocalDate,
  paymentMethodId: number | null,
  beforeId?: number,
  signal?: AbortSignal
): Promise<ReceivedEntry[]> {
  const query = new URLSearchParams({
    date,
    paymentMethod: paymentMethodId === null ? "cash" : String(paymentMethodId)
  });
  if (beforeId !== undefined) query.set("beforeId", String(beforeId));
  return apiRequest(`/api/money/received-entries?${query}`, { signal });
}

export function listRecentVendorNames(search: string, signal?: AbortSignal): Promise<string[]> {
  return apiRequest(`/api/money/vendors?q=${encodeURIComponent(search.trim())}`, { signal });
}
