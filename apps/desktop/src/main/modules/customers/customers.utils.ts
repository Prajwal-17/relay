import { and, eq, sql, type SQL } from "drizzle-orm";
import {
  ACTIVITY_KIND,
  CUSTOMER_TXN_STATUS,
  LEDGER_ENTRY_TYPE,
  type ActivityEvent
} from "../../../shared/types";
import { formatRupee } from "../../../shared/utils/utils";
import { estimates, sales } from "../../db/schema";
import type {
  EstimatesByCustomerParams,
  LedgerEventRow,
  SalesByCustomerParams
} from "./customers.types";

export const buildSalesWhere = (params: SalesByCustomerParams): SQL => {
  const conditions: SQL[] = [eq(sales.customerId, params.customerId)];
  if (params.status === CUSTOMER_TXN_STATUS.PAID) conditions.push(eq(sales.isPaid, true));
  else if (params.status === CUSTOMER_TXN_STATUS.UNPAID) conditions.push(eq(sales.isPaid, false));
  if (params.search !== "") {
    conditions.push(sql`CAST(${sales.invoiceNo} AS TEXT) LIKE ${`%${params.search}%`}`);
  }
  return and(...conditions)!;
};

export const buildEstimatesWhere = (params: EstimatesByCustomerParams): SQL => {
  const conditions: SQL[] = [eq(estimates.customerId, params.customerId)];
  if (params.status === CUSTOMER_TXN_STATUS.PAID) conditions.push(eq(estimates.isPaid, true));
  else if (params.status === CUSTOMER_TXN_STATUS.UNPAID)
    conditions.push(eq(estimates.isPaid, false));
  if (params.search !== "") {
    conditions.push(sql`CAST(${estimates.estimateNo} AS TEXT) LIKE ${`%${params.search}%`}`);
  }
  return and(...conditions)!;
};

export function mapLedgerEvent(row: LedgerEventRow): ActivityEvent {
  switch (row.type) {
    case LEDGER_ENTRY_TYPE.PAYMENT:
      return {
        id: `ledger:${row.id}`,
        date: row.createdAt,
        kind: ACTIVITY_KIND.PAYMENT,
        title: "Payment received",
        description: `${formatRupee(row.amountPaid ?? 0)} via ${row.paymentMode ?? "cash"}${row.notes ? ` — ${row.notes}` : ""}`
      };
    case LEDGER_ENTRY_TYPE.ADJUSTMENT:
      return {
        id: `ledger:${row.id}`,
        date: row.createdAt,
        kind: ACTIVITY_KIND.ADJUSTMENT,
        title: "Balance adjusted",
        description: `${row.notes ? `${row.notes}` : "Manual adjustment"} (${formatRupee((row.amountPaid ?? 0) - (row.amountDue ?? 0))})`
      };
    case LEDGER_ENTRY_TYPE.QUICK_SALE:
      return {
        id: `ledger:${row.id}`,
        date: row.createdAt,
        kind: ACTIVITY_KIND.QUICK_SALE,
        title: "Quick sale recorded",
        description: `${formatRupee(row.amountDue ?? 0)}${row.notes ? ` — ${row.notes}` : ""}`
      };
    case LEDGER_ENTRY_TYPE.OPENING_BALANCE:
      return {
        id: `ledger:${row.id}`,
        date: row.createdAt,
        kind: ACTIVITY_KIND.OPENING_BALANCE,
        title: "Opening balance set",
        description: `${formatRupee(row.amountDue ?? 0)}${row.notes ? ` — ${row.notes}` : ""}`
      };
    default:
      return {
        id: `ledger:${row.id}`,
        date: row.createdAt,
        kind: ACTIVITY_KIND.ADJUSTMENT,
        title: "Ledger entry",
        description: row.notes ?? ""
      };
  }
}
