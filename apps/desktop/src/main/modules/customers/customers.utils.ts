import { and, eq, sql, type SQL } from "drizzle-orm";
import { estimates, sales } from "../../db/schema";
import { CUSTOMER_TXN_STATUS } from "../../../shared/types";
import type { EstimatesByCustomerParams, SalesByCustomerParams } from "./customers.types";

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
