import { apiClient } from "@/lib/apiClient";
import { prepareRasterLedger } from "@/features/settings/thermalRaster";
import {
  LEDGER_ENTRY_TYPE,
  LEDGER_SORT,
  LEDGER_TYPE_FILTER,
  type AppPreferencesResponse,
  type LedgerEntry,
  type LedgerSort,
  type LedgerSummary,
  type PaginatedApiResponse,
  type PrintingConfig,
  type RasterLedgerSegments,
  type RawLedgerStatementData,
  type StoreProfile
} from "@shared/types";
import { buildReceiptAddressLines } from "@shared/utils/thermalReceipt";
import { useCallback } from "react";

export type LedgerPrintCustomer = {
  id: string;
  name: string;
};

export const MAX_RECENT_LEDGER_PRINT_ENTRIES = 500;

export type LedgerPrintSelection =
  | { scope: "recent"; count: number }
  | { scope: "dateRange"; fromDate: string; toDate: string }
  | { scope: "all" };

const COMPLETE_LEDGER_SELECTION: LedgerPrintSelection = { scope: "all" };

export function getPrintedLedgerParticulars(entry: LedgerEntry): string {
  switch (entry.type) {
    case LEDGER_ENTRY_TYPE.SALE:
      return "Sale";
    case LEDGER_ENTRY_TYPE.QUICK_SALE:
      return "Sale";
    case LEDGER_ENTRY_TYPE.PAYMENT:
      return "Payment";
    case LEDGER_ENTRY_TYPE.ADJUSTMENT:
      return "Adjustment";
    case LEDGER_ENTRY_TYPE.OPENING_BALANCE:
      return "Opening balance";
  }
}

export function buildRawLedgerStatementData(
  customerName: string,
  entries: LedgerEntry[],
  summary: LedgerSummary,
  profile: StoreProfile,
  printing: PrintingConfig,
  generatedAt = new Date().toISOString()
): RawLedgerStatementData {
  if (!customerName.trim()) throw new Error("A customer name is required for ledger printing.");
  if (entries.length === 0) throw new Error("This customer has no ledger history to print.");

  const selectedTotals = entries.reduce(
    (totals, entry) => ({
      due: totals.due + entry.amountDue,
      paid: totals.paid + entry.amountPaid
    }),
    { due: 0, paid: 0 }
  );

  const firstEntry = entries[0]!;
  const previousBalance = firstEntry.runningBalance - firstEntry.amountDue + firstEntry.amountPaid;

  return {
    storeName: profile.storeName,
    addressLines: printing.showAddress ? buildReceiptAddressLines(profile) : [],
    phone: printing.showPhone && profile.phone.trim() ? profile.phone.trim() : undefined,
    customerName: customerName.trim(),
    generatedAt,
    entries: entries.map((entry) => ({
      dateTime: entry.createdAt,
      particulars: getPrintedLedgerParticulars(entry),
      amountDuePaisa: entry.amountDue,
      amountPaidPaisa: entry.amountPaid,
      runningBalancePaisa: entry.runningBalance
    })),
    previousBalancePaisa: previousBalance,
    totalDuePaisa: selectedTotals.due,
    totalPaidPaisa: selectedTotals.paid,
    closingBalancePaisa: entries.at(-1)?.runningBalance ?? summary.currentBalance,
    extraFeedLines: printing.extraFeedLines,
    cutMode: printing.cutMode,
    footerMessage: printing.footerMessage.trim() || undefined
  };
}

async function fetchLedgerPage(
  customerId: string,
  pageNo: number,
  pageSize: number,
  sort: LedgerSort
) {
  return apiClient.get<PaginatedApiResponse<{ data: LedgerEntry[] }>>(
    "/api/customers/" + encodeURIComponent(customerId) + "/ledger",
    {
      pageNo,
      pageSize,
      search: "",
      type: LEDGER_TYPE_FILTER.ALL,
      sort
    }
  );
}

async function fetchCompleteLedger(customerId: string): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];
  let pageNo = 1;

  while (true) {
    const page = await fetchLedgerPage(customerId, pageNo, 100, LEDGER_SORT.DATE_ASC);
    entries.push(...page.data);
    if (page.nextPageNo == null) return entries;
    pageNo = page.nextPageNo;
  }
}

function getIndiaDateBoundary(date: string, endOfDay: boolean) {
  if (date.length !== 10 || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
    throw new Error("Choose a valid date range to print.");
  }

  const timestamp = Date.parse(
    date + "T" + (endOfDay ? "23:59:59.999" : "00:00:00.000") + "+05:30"
  );
  if (!Number.isFinite(timestamp)) throw new Error("Choose a valid date range to print.");
  return timestamp;
}

async function fetchLedgerDateRange(
  customerId: string,
  fromDate: string,
  toDate: string
): Promise<LedgerEntry[]> {
  const fromTimestamp = getIndiaDateBoundary(fromDate, false);
  const toTimestamp = getIndiaDateBoundary(toDate, true);
  if (fromTimestamp > toTimestamp) {
    throw new Error("The start date must be before the end date.");
  }

  const entries: LedgerEntry[] = [];
  let pageNo = 1;

  while (true) {
    const page = await fetchLedgerPage(customerId, pageNo, 100, LEDGER_SORT.DATE_DESC);

    for (const entry of page.data) {
      const timestamp = Date.parse(entry.createdAt);
      if (timestamp >= fromTimestamp && timestamp <= toTimestamp) entries.push(entry);
    }

    const oldestTimestamp = Math.min(...page.data.map((entry) => Date.parse(entry.createdAt)));
    if (
      page.nextPageNo == null ||
      page.data.length === 0 ||
      (Number.isFinite(oldestTimestamp) && oldestTimestamp < fromTimestamp)
    ) {
      return entries.sort(
        (first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt)
      );
    }

    pageNo = page.nextPageNo;
  }
}

async function fetchLedgerForPrint(
  customerId: string,
  selection: LedgerPrintSelection
): Promise<LedgerEntry[]> {
  if (selection.scope === "all") return fetchCompleteLedger(customerId);

  if (selection.scope === "dateRange") {
    return fetchLedgerDateRange(customerId, selection.fromDate, selection.toDate);
  }

  if (
    !Number.isInteger(selection.count) ||
    selection.count < 1 ||
    selection.count > MAX_RECENT_LEDGER_PRINT_ENTRIES
  ) {
    throw new Error("Choose between 1 and " + MAX_RECENT_LEDGER_PRINT_ENTRIES + " recent entries.");
  }

  const entries: LedgerEntry[] = [];
  const pageSize = Math.min(selection.count, 100);
  let pageNo = 1;

  while (entries.length < selection.count) {
    const page = await fetchLedgerPage(customerId, pageNo, pageSize, LEDGER_SORT.DATE_DESC);
    entries.push(...page.data);
    if (page.nextPageNo == null) break;
    pageNo = page.nextPageNo;
  }

  return entries.slice(0, selection.count).reverse();
}

export function useRawLedgerPrint() {
  const prepareCustomerLedger = useCallback(
    async (
      customer: LedgerPrintCustomer,
      selection: LedgerPrintSelection = COMPLETE_LEDGER_SELECTION,
      options: { includeHeader?: boolean; includeFooter?: boolean } = {}
    ) => {
      if (!customer.id.trim()) throw new Error("Choose a customer before printing their ledger.");

      const preferences = await apiClient.get<AppPreferencesResponse>("/api/app-preferences");
      if (customer.id === preferences.config.billing.defaultCustomerId) {
        throw new Error("Choose an account customer before printing a ledger.");
      }

      const [profile, source] = await Promise.all([
        apiClient.get<StoreProfile>("/api/store-profile"),
        fetchLedgerStatementSource(customer.id, selection)
      ]);

      const statement = buildRawLedgerStatementData(
        customer.name,
        source.entries,
        source.summary,
        profile,
        preferences.config.printing
      );
      let raster: RasterLedgerSegments | undefined;
      if (preferences.config.printing.defaultPrintMode === "raster") {
        try {
          raster = await prepareRasterLedger(statement, options);
        } catch (error) {
          console.warn("High-quality ledger preparation failed; device text will be used.", error);
        }
      }
      return { statement, raster };
    },
    []
  );

  const printCustomerLedger = useCallback(
    async (
      customer: LedgerPrintCustomer,
      selection: LedgerPrintSelection = COMPLETE_LEDGER_SELECTION
    ) => {
      const { statement, raster } = await prepareCustomerLedger(customer, selection);
      const response = await window.rawPrintApi.printLedger(statement, raster);
      if (response.status === "error") throw new Error(response.error.message);
      return response.data;
    },
    [prepareCustomerLedger]
  );

  return { prepareCustomerLedger, printCustomerLedger };
}

export async function fetchLedgerStatementSource(
  customerId: string,
  selection: LedgerPrintSelection
): Promise<{ entries: LedgerEntry[]; summary: LedgerSummary }> {
  if (!customerId.trim()) throw new Error("Choose a customer before loading their ledger.");

  const encodedCustomerId = encodeURIComponent(customerId);
  const [summary, entries] = await Promise.all([
    apiClient.get<LedgerSummary>("/api/customers/" + encodedCustomerId + "/ledger-summary"),
    fetchLedgerForPrint(customerId, selection)
  ]);

  if (entries.length === 0) {
    throw new Error(
      selection.scope === "dateRange"
        ? "No account entries were found in the selected date range."
        : "This customer has no ledger history to print."
    );
  }

  return { entries, summary };
}
