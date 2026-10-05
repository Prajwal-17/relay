import { apiRequest } from "@/lib/api/api-client";
import type { LedgerMonth } from "@/lib/format/dates";
import type {
  DaySummary,
  MoneyEditableEntry,
  LocalDate,
  MoneyWeek,
  MoneyMutationResult,
  ReceivedHistoryPage,
  ReceivedPaymentInput,
  VendorPaymentInput
} from "./money.types";

function jsonBody(value: unknown): RequestInit {
  return { body: JSON.stringify(value) };
}

export function getMonthSummaries(month: LedgerMonth, signal?: AbortSignal): Promise<DaySummary[]> {
  const query = new URLSearchParams({ year: String(month.year), month: String(month.month + 1) });
  return apiRequest(`/api/money/summaries?${query}`, { signal });
}

export function getMoneyWeek(
  startDate: LocalDate,
  endDate: LocalDate,
  signal?: AbortSignal
): Promise<MoneyWeek> {
  const query = new URLSearchParams({ startDate, endDate });
  return apiRequest(`/api/money/weeks?${query}`, { signal });
}

export function deleteDailyEntry(date: LocalDate): Promise<MoneyMutationResult> {
  return apiRequest(`/api/money/days/${date}`, { method: "DELETE" });
}

export function addReceivedPayment(input: ReceivedPaymentInput): Promise<MoneyMutationResult> {
  return apiRequest("/api/money/received-payments", {
    method: "POST",
    ...jsonBody(input)
  });
}

export function addVendorPayment(input: VendorPaymentInput): Promise<MoneyMutationResult> {
  return apiRequest("/api/money/vendor-payments", {
    method: "POST",
    ...jsonBody(input)
  });
}

export function deleteVendorPayment(id: number): Promise<MoneyMutationResult> {
  return apiRequest(`/api/money/vendor-payments/${id}`, { method: "DELETE" });
}

export function getReceivedHistory(
  date: LocalDate,
  paymentMethodId: number | null,
  beforeId?: number,
  signal?: AbortSignal
): Promise<ReceivedHistoryPage> {
  const query = new URLSearchParams({
    date,
    paymentMethod: paymentMethodId === null ? "cash" : String(paymentMethodId)
  });
  if (beforeId !== undefined) query.set("beforeId", String(beforeId));
  return apiRequest(`/api/money/received-history?${query}`, { signal });
}

export function deleteReceivedEntry(id: number): Promise<MoneyMutationResult> {
  return apiRequest(`/api/money/received-entries/${id}`, { method: "DELETE" });
}

export function listVendorNames(signal?: AbortSignal): Promise<string[]> {
  return apiRequest("/api/money/vendors", { signal });
}

export function getMoneyEntry(
  kind: "received" | "vendor",
  id: number,
  signal?: AbortSignal
): Promise<MoneyEditableEntry> {
  return apiRequest(
    `/api/money/${kind === "received" ? "received-entries" : "vendor-payments"}/${id}`,
    { signal }
  );
}

export function updateReceivedPayment(
  id: number,
  input: Omit<ReceivedPaymentInput, "date">
): Promise<MoneyMutationResult> {
  return apiRequest(`/api/money/received-entries/${id}`, { method: "PATCH", ...jsonBody(input) });
}

export function updateVendorPayment(
  id: number,
  input: Omit<VendorPaymentInput, "date">
): Promise<MoneyMutationResult> {
  return apiRequest(`/api/money/vendor-payments/${id}`, { method: "PATCH", ...jsonBody(input) });
}
