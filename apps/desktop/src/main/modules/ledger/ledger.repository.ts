import { and, asc, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  LEDGER_ENTRY_TYPE,
  LEDGER_SORT,
  LEDGER_TYPE_FILTER,
  type CreateAdjustmentPayload,
  type CreateOpeningBalancePayload,
  type CreatePaymentPayload,
  type CreateQuickSalePayload,
  type LedgerEntry,
  type LedgerSort,
  type LedgerTypeFilter
} from "../../../shared/types";
import { db } from "../../db/db";
import type * as schema from "../../db/schema";
import { customerLedger, customers, sales } from "../../db/schema";
import type { GetLedgerParams, InsertSaleEntryParams } from "./ledger.types";

type Tx = BetterSQLite3Database<typeof schema>;

const buildWhereClause = (params: {
  customerId: string;
  type: LedgerTypeFilter;
  search: string;
}) => {
  const conditions = [eq(customerLedger.customerId, params.customerId)];

  if (params.type !== LEDGER_TYPE_FILTER.ALL) {
    conditions.push(eq(customerLedger.type, params.type));
  }

  if (params.search !== "") {
    conditions.push(like(customerLedger.notes, `%${params.search}%`));
  }

  return and(...conditions);
};

const buildOrderBy = (sort: LedgerSort) => {
  return sort === LEDGER_SORT.DATE_ASC
    ? [asc(customerLedger.createdAt), asc(customerLedger.id)]
    : [desc(customerLedger.createdAt), desc(customerLedger.id)];
};

const getLedgerByCustomerId = (params: GetLedgerParams): LedgerEntry[] => {
  const offset = (params.pageNo - 1) * params.pageSize;
  const where = buildWhereClause(params);
  const orderBy = buildOrderBy(params.sort);

  const rows = db
    .select({
      id: customerLedger.id,
      customerId: customerLedger.customerId,
      type: customerLedger.type,
      saleId: customerLedger.saleId,
      invoiceNo: sales.invoiceNo,
      debit: customerLedger.debit,
      credit: customerLedger.credit,
      paymentMode: customerLedger.paymentMode,
      notes: customerLedger.notes,
      runningBalance: sql<number>`(
        SELECT COALESCE(SUM(COALESCE(l2.debit, 0) - COALESCE(l2.credit, 0)), 0)
        FROM customer_ledger l2
        WHERE l2.customer_id = customer_ledger.customer_id
          AND (l2.created_at < customer_ledger.created_at
            OR (l2.created_at = customer_ledger.created_at AND l2.id <= customer_ledger.id))
      )`,
      createdAt: customerLedger.createdAt
    })
    .from(customerLedger)
    .leftJoin(sales, eq(customerLedger.saleId, sales.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(params.pageSize)
    .offset(offset)
    .all();

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customerId,
    type: row.type as LedgerEntry["type"],
    saleId: row.saleId,
    invoiceNo: row.invoiceNo ?? null,
    debit: row.debit ?? 0,
    credit: row.credit ?? 0,
    paymentMode: row.paymentMode,
    notes: row.notes,
    runningBalance: row.runningBalance ?? 0,
    createdAt: row.createdAt
  }));
};

const countLedgerByCustomerId = (params: {
  customerId: string;
  type: LedgerTypeFilter;
  search: string;
}): number => {
  const result = db
    .select({ count: count() })
    .from(customerLedger)
    .where(buildWhereClause(params))
    .get();
  return result?.count ?? 0;
};

const getLedgerSummary = (customerId: string) => {
  return db.transaction((tx) => {
    const totals = tx
      .select({
        totalDebit: sql<number>`COALESCE(SUM(${customerLedger.debit}), 0)`,
        totalCredit: sql<number>`COALESCE(SUM(${customerLedger.credit}), 0)`
      })
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customerId))
      .get();

    const opening = tx
      .select()
      .from(customerLedger)
      .where(
        and(
          eq(customerLedger.customerId, customerId),
          eq(customerLedger.type, LEDGER_ENTRY_TYPE.OPENING_BALANCE)
        )
      )
      .get();

    const lastPayment = tx
      .select()
      .from(customerLedger)
      .where(
        and(
          eq(customerLedger.customerId, customerId),
          eq(customerLedger.type, LEDGER_ENTRY_TYPE.PAYMENT)
        )
      )
      .orderBy(desc(customerLedger.createdAt), desc(customerLedger.id))
      .limit(1)
      .get();

    const salesAgg = tx
      .select({
        salesTotal: sql<number>`COALESCE(SUM(${customerLedger.debit}), 0)`,
        salesCount: count()
      })
      .from(customerLedger)
      .where(
        and(
          eq(customerLedger.customerId, customerId),
          inArray(customerLedger.type, [LEDGER_ENTRY_TYPE.SALE, LEDGER_ENTRY_TYPE.QUICK_SALE])
        )
      )
      .get();

    const totalDebit = totals?.totalDebit ?? 0;
    const totalCredit = totals?.totalCredit ?? 0;
    const salesTotal = salesAgg?.salesTotal ?? 0;
    const salesCount = salesAgg?.salesCount ?? 0;

    return {
      currentBalance: totalDebit - totalCredit,
      totalDebit,
      totalCredit,
      openingBalance: opening ? (opening.debit ?? 0) - (opening.credit ?? 0) : 0,
      avgSale: salesCount > 0 ? Math.round(salesTotal / salesCount) : 0,
      salesCount,
      lastPayment: lastPayment
        ? {
            amount: lastPayment.credit ?? 0,
            mode: lastPayment.paymentMode ?? "cash",
            date: lastPayment.createdAt
          }
        : null
    };
  });
};

const hasOpeningBalance = (tx: Tx, customerId: string): boolean => {
  const row = tx
    .select({ id: customerLedger.id })
    .from(customerLedger)
    .where(
      and(
        eq(customerLedger.customerId, customerId),
        eq(customerLedger.type, LEDGER_ENTRY_TYPE.OPENING_BALANCE)
      )
    )
    .get();
  return !!row;
};

const insertPayment = (tx: Tx, customerId: string, payload: CreatePaymentPayload) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId,
      type: LEDGER_ENTRY_TYPE.PAYMENT,
      debit: 0,
      credit: payload.amount,
      paymentMode: payload.mode,
      notes: payload.notes ?? null,
      createdAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .returning()
    .get();
};

const insertAdjustment = (tx: Tx, customerId: string, payload: CreateAdjustmentPayload) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId,
      type: LEDGER_ENTRY_TYPE.ADJUSTMENT,
      debit: payload.direction === "debit" ? payload.amount : 0,
      credit: payload.direction === "credit" ? payload.amount : 0,
      notes: payload.notes ?? null
    })
    .returning()
    .get();
};

const insertQuickSale = (tx: Tx, customerId: string, payload: CreateQuickSalePayload) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId,
      type: LEDGER_ENTRY_TYPE.QUICK_SALE,
      debit: payload.amount,
      credit: 0,
      notes: payload.notes ?? null
    })
    .returning()
    .get();
};

const insertOpeningBalance = (tx: Tx, customerId: string, payload: CreateOpeningBalancePayload) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId,
      type: LEDGER_ENTRY_TYPE.OPENING_BALANCE,
      debit: payload.amount,
      credit: 0,
      notes: payload.notes ?? null
    })
    .returning()
    .get();
};

const insertSaleEntry = (tx: Tx, params: InsertSaleEntryParams) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId: params.customerId,
      type: LEDGER_ENTRY_TYPE.SALE,
      saleId: params.saleId,
      debit: params.debit,
      credit: 0
    })
    .returning()
    .get();
};

const updateSaleEntryDebit = (tx: Tx, saleId: string, debit: number) => {
  return tx.update(customerLedger).set({ debit }).where(eq(customerLedger.saleId, saleId)).run();
};

const deleteSaleEntry = (tx: Tx, saleId: string) => {
  return tx.delete(customerLedger).where(eq(customerLedger.saleId, saleId)).run();
};

const recomputeOutstanding = (tx: Tx, customerId: string) => {
  const result = tx
    .select({
      balance: sql<number>`COALESCE(SUM(COALESCE(${customerLedger.debit}, 0) - COALESCE(${customerLedger.credit}, 0)), 0)`
    })
    .from(customerLedger)
    .leftJoin(sales, eq(customerLedger.saleId, sales.id))
    .where(
      and(
        eq(customerLedger.customerId, customerId),
        sql`NOT (${customerLedger.type} = 'sale' AND COALESCE(${sales.isPaid}, 0) = 1)`
      )
    )
    .get();

  tx.update(customers)
    .set({ outstandingBalance: result?.balance ?? 0 })
    .where(eq(customers.id, customerId))
    .run();
};

export const ledgerRepository = {
  getLedgerByCustomerId,
  countLedgerByCustomerId,
  getLedgerSummary,
  hasOpeningBalance,
  insertPayment,
  insertAdjustment,
  insertQuickSale,
  insertOpeningBalance,
  insertSaleEntry,
  updateSaleEntryDebit,
  deleteSaleEntry,
  recomputeOutstanding
};
