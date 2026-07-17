import z from "zod";
import { LEDGER_SORT, LEDGER_TYPE_FILTER, PAYMENT_MODE } from "../../../shared/types";

export const getLedgerSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().default(""),
  type: z
    .enum([
      LEDGER_TYPE_FILTER.ALL,
      LEDGER_TYPE_FILTER.SALE,
      LEDGER_TYPE_FILTER.QUICK_SALE,
      LEDGER_TYPE_FILTER.PAYMENT,
      LEDGER_TYPE_FILTER.ADJUSTMENT,
      LEDGER_TYPE_FILTER.OPENING_BALANCE
    ])
    .default(LEDGER_TYPE_FILTER.ALL),
  sort: z.enum([LEDGER_SORT.DATE_DESC, LEDGER_SORT.DATE_ASC]).default(LEDGER_SORT.DATE_DESC)
});

export const createPaymentSchema = z.object({
  amount: z.number().int().positive(),
  mode: z.enum([PAYMENT_MODE.CASH, PAYMENT_MODE.UPI, PAYMENT_MODE.CARD]),
  notes: z.string().trim().optional()
});

export const createAdjustmentSchema = z.object({
  amount: z.number().int().positive(),
  direction: z.enum(["due", "paid"]),
  notes: z.string().trim().optional()
});

export const createQuickSaleSchema = z.object({
  amount: z.number().int().positive(),
  notes: z.string().trim().optional()
});

export const createOpeningBalanceSchema = z.object({
  amount: z.number().int().nonnegative(),
  notes: z.string().trim().optional()
});
