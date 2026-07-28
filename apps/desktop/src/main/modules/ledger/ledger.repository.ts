import { and, asc, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  LEDGER_ENTRY_TYPE,
  LEDGER_SORT,
  LEDGER_TYPE_FILTER,
  type CreateAdjustmentPayload,
  type CreatePaymentResult,
  type CreateQuickSalePayload,
  type LedgerEntry,
  type LedgerSort,
  type LedgerTypeFilter,
  type UpdateLedgerEntryPayload
} from "../../../shared/types";
import { db } from "../../db/db";
import type * as schema from "../../db/schema";
import { customerLedger, customers, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import type { CreatePaymentParams, GetLedgerParams, InsertSaleEntryParams } from "./ledger.types";

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
      amountDue: customerLedger.amountDue,
      amountPaid: customerLedger.amountPaid,
      paymentMode: customerLedger.paymentMode,
      notes: customerLedger.notes,
      runningBalance: sql<number>`(
        SELECT COALESCE(SUM(COALESCE(l2.amount_due, 0) - COALESCE(l2.amount_paid, 0)), 0)
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
    amountDue: row.amountDue ?? 0,
    amountPaid: row.amountPaid ?? 0,
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
        totalDue: sql<number>`COALESCE(SUM(${customerLedger.amountDue}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${customerLedger.amountPaid}), 0)`
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
        salesTotal: sql<number>`COALESCE(SUM(${customerLedger.amountDue}), 0)`,
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

    const totalDue = totals?.totalDue ?? 0;
    const totalPaid = totals?.totalPaid ?? 0;
    const salesTotal = salesAgg?.salesTotal ?? 0;
    const salesCount = salesAgg?.salesCount ?? 0;

    return {
      currentBalance: totalDue - totalPaid,
      totalDue,
      totalPaid,
      openingBalance: opening ? (opening.amountDue ?? 0) - (opening.amountPaid ?? 0) : 0,
      avgSale: salesCount > 0 ? Math.round(salesTotal / salesCount) : 0,
      salesCount,
      lastPayment: lastPayment
        ? {
            amount: lastPayment.amountPaid ?? 0,
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

const insertPaymentEntry = (
  tx: Tx,
  params: {
    customerId: string;
    storeId: string | null;
    saleId: string | null;
    amountPaid: number;
    paymentMode: string;
    notes: string | null;
  }
) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId: params.customerId,
      storeId: params.storeId,
      type: LEDGER_ENTRY_TYPE.PAYMENT,
      saleId: null,
      amountDue: 0,
      amountPaid: params.amountPaid,
      paymentMode: params.paymentMode,
      notes: params.notes,
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
      amountDue: payload.direction === "due" ? payload.amount : 0,
      amountPaid: payload.direction === "paid" ? payload.amount : 0,
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
      amountDue: payload.amount,
      amountPaid: 0,
      notes: payload.notes ?? null
    })
    .returning()
    .get();
};

const insertOpeningBalance = (
  tx: Tx,
  customerId: string,
  payload: { amount: number; notes?: string }
) => {
  return tx
    .insert(customerLedger)
    .values({
      customerId,
      type: LEDGER_ENTRY_TYPE.OPENING_BALANCE,
      amountDue: payload.amount,
      amountPaid: 0,
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
      amountDue: params.amountDue,
      amountPaid: 0
    })
    .returning()
    .get();
};

const updateSaleEntryAmountDue = (tx: Tx, saleId: string, amountDue: number) => {
  return tx
    .update(customerLedger)
    .set({ amountDue })
    .where(eq(customerLedger.saleId, saleId))
    .run();
};

const deleteAllLedgerEntriesForSale = (tx: Tx, saleId: string) => {
  return tx.delete(customerLedger).where(eq(customerLedger.saleId, saleId)).run();
};

const getLedgerEntriesForSale = (tx: Tx, saleId: string) => {
  return tx.select().from(customerLedger).where(eq(customerLedger.saleId, saleId)).all();
};

const upsertSaleEntry = (tx: Tx, params: InsertSaleEntryParams) => {
  const existing = tx
    .select()
    .from(customerLedger)
    .where(
      and(eq(customerLedger.saleId, params.saleId), eq(customerLedger.type, LEDGER_ENTRY_TYPE.SALE))
    )
    .get();

  if (existing) {
    return tx
      .update(customerLedger)
      .set({
        customerId: params.customerId,
        amountDue: params.amountDue,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .where(eq(customerLedger.id, existing.id))
      .returning()
      .get();
  }

  return tx
    .insert(customerLedger)
    .values({
      customerId: params.customerId,
      type: LEDGER_ENTRY_TYPE.SALE,
      saleId: params.saleId,
      amountDue: params.amountDue,
      amountPaid: 0,
      createdAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .returning()
    .get();
};

const findLedgerEntryById = (tx: Tx, entryId: string) => {
  return tx.select().from(customerLedger).where(eq(customerLedger.id, entryId)).get();
};

const updateLedgerEntry = (tx: Tx, entryId: string, updates: UpdateLedgerEntryPayload) => {
  const setData: Record<string, unknown> = {
    updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
  };
  if (updates.amountDue !== undefined) setData.amountDue = updates.amountDue;
  if (updates.amountPaid !== undefined) setData.amountPaid = updates.amountPaid;
  if (updates.paymentMode !== undefined) setData.paymentMode = updates.paymentMode;
  if (updates.notes !== undefined) setData.notes = updates.notes;

  return tx
    .update(customerLedger)
    .set(setData)
    .where(eq(customerLedger.id, entryId))
    .returning()
    .get();
};

const deleteLedgerEntryById = (tx: Tx, entryId: string) => {
  return tx.delete(customerLedger).where(eq(customerLedger.id, entryId)).run();
};

const findCustomerById = (tx: Tx, customerId: string) => {
  return tx.select().from(customers).where(eq(customers.id, customerId)).get();
};

const createPayment = ({ customerId, payload }: CreatePaymentParams): CreatePaymentResult => {
  return db.transaction((tx) => {
    const customer = findCustomerById(tx, customerId);
    if (!customer) {
      throw new AppError(`Customer with ID  not found`, 404);
    }

    const entry = insertPaymentEntry(tx, {
      customerId,
      storeId: customer.storeId ?? null,
      saleId: null,
      amountPaid: payload.amount,
      paymentMode: payload.mode,
      notes: payload.notes ?? null
    });

    recomputeOutstanding(tx, customerId);
    return { ledgerEntryId: entry.id };
  });
};

const recomputeOutstanding = (tx: Tx, customerId: string) => {
  const result = tx
    .select({
      balance: sql<number>`COALESCE(SUM(COALESCE(${customerLedger.amountDue}, 0) - COALESCE(${customerLedger.amountPaid}, 0)), 0)`
    })
    .from(customerLedger)
    .where(eq(customerLedger.customerId, customerId))
    .get();

  tx.update(customers)
    .set({
      outstandingBalance: result?.balance ?? 0,
      updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .where(eq(customers.id, customerId))
    .run();
};

export const ledgerRepository = {
  findCustomerById,
  createPayment,
  getLedgerByCustomerId,
  countLedgerByCustomerId,
  getLedgerSummary,
  hasOpeningBalance,
  insertPaymentEntry,
  insertAdjustment,
  insertQuickSale,
  insertOpeningBalance,
  insertSaleEntry,
  updateSaleEntryAmountDue,
  deleteAllLedgerEntriesForSale,
  getLedgerEntriesForSale,
  upsertSaleEntry,
  findLedgerEntryById,
  updateLedgerEntry,
  deleteLedgerEntryById,
  recomputeOutstanding
};
