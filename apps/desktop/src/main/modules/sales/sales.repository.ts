import { and, asc, count, desc, eq, gte, inArray, lte, or, sql, sum, type SQL } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  BATCH_CHECK_ACTION,
  UPDATE_QTY_ACTION,
  type BatchCheckAction,
  type SyncedItems,
  type TxnPayloadData,
  type UpdateQtyAction
} from "../../../shared/types";
import { fromMilliUnits, toMilliUnits } from "../../../shared/utils/milliUnits";
import { roundPaisaToNearestRupee } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import type * as schema from "../../db/schema";
import { customers, products, saleItems, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { updateCheckedQuantityUtil } from "../../utils/product.utils";
import { ledgerRepository } from "../ledger/ledger.repository";
import type { FilterSalesParams } from "./sales.types";
import { assertAccountingCustomer, assertSaleCanModify } from "./sales.utils";

type Tx = BetterSQLite3Database<typeof schema>;

type SalePayloadData = Extract<TxnPayloadData, { transactionType: "sale" }>;

const getSaleById = async (id: string) => {
  return await db.query.sales.findFirst({
    where: eq(sales.id, id),
    with: {
      customer: true,
      customerLedgerEntries: true,
      saleItems: {
        orderBy: [asc(saleItems.position), asc(saleItems.createdAt)]
      }
    }
  });
};

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const buildSaleSearchFilter = (search: string): SQL | undefined => {
  if (!search) return undefined;

  const customerNamePattern = `%${escapeLikePattern(search.toLowerCase())}%`;
  const customerMatches = inArray(
    sales.customerId,
    db
      .select({ id: customers.id })
      .from(customers)
      .where(sql`lower(${customers.name}) like ${customerNamePattern} escape '\\'`)
  );
  const documentSearch = search.startsWith("#") ? search.slice(1) : search;

  if (!/^\d+$/.test(documentSearch)) return customerMatches;

  const documentNumber = Number(documentSearch);
  return Number.isSafeInteger(documentNumber)
    ? or(customerMatches, eq(sales.invoiceNo, documentNumber))
    : customerMatches;
};

const getLatestInvoiceNo = async () => {
  return db.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1).get();
};

const filterSalesByDate = async (
  params: Omit<FilterSalesParams, "sortBy"> & {
    orderByClause: SQL;
  }
) => {
  const offset = (params.pageNo - 1) * params.pageSize;
  const searchFilter = buildSaleSearchFilter(params.search);
  const whereClause = and(
    gte(sales.createdAt, params.from),
    lte(sales.createdAt, params.to),
    searchFilter
  );

  const [summaryResult, transactionsResult] = await Promise.all([
    db
      .select({
        totalRevenue: sum(sales.grandTotal).mapWith(Number),
        totalTransactions: count(sales.id).mapWith(Number)
      })
      .from(sales)
      .where(whereClause)
      .orderBy(params.orderByClause),

    db.query.sales.findMany({
      where: whereClause,
      with: {
        customer: true,
        customerLedgerEntries: true
      },
      orderBy: params.orderByClause,
      limit: params.pageSize,
      offset: offset
    })
  ]);

  return {
    summaryResult,
    transactionsResult
  };
};

// a create may finish even if its reply times out.
// example: the same id and token return the saved sale instead of making a duplicate.
const findSaleCreateReplay = (tx: Tx, payload: SalePayloadData) => {
  if (!payload.billingId && !payload.creationToken) return null;
  if (!payload.billingId || !payload.creationToken) {
    throw new AppError("Sale creation identity is incomplete", 409);
  }

  const saleById = tx.select().from(sales).where(eq(sales.id, payload.billingId)).get();
  const saleByToken = tx
    .select()
    .from(sales)
    .where(eq(sales.creationToken, payload.creationToken))
    .get();

  if (!saleById && !saleByToken) return null;
  if (!saleById || !saleByToken || saleById.id !== saleByToken.id) {
    throw new AppError("Sale creation identity conflicts with an existing sale", 409);
  }

  const persistedItems = tx
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, saleById.id))
    .orderBy(asc(saleItems.position), asc(saleItems.createdAt))
    .all();
  const requestedItems = payload.items.filter((item) => !item.isDeleted);
  if (persistedItems.length !== requestedItems.length) {
    throw new AppError("Sale replay does not match the original request", 409);
  }

  const claimedItemIds = new Set<string>();
  const syncedItems = requestedItems.map((item, index) => {
    const persistedItem = item.id
      ? persistedItems.find((candidate) => candidate.id === item.id)
      : persistedItems[index];
    if (!persistedItem || claimedItemIds.has(persistedItem.id)) {
      throw new AppError("Sale replay does not match the original request", 409);
    }
    claimedItemIds.add(persistedItem.id);
    return { rowId: item.rowId, id: persistedItem.id, updatedAt: persistedItem.updatedAt };
  });

  return {
    billingId: saleById.id,
    transactionNo: saleById.invoiceNo,
    syncedItems,
    deletedRowIds: []
  };
};

const createSale = async (payload: SalePayloadData) => {
  return db.transaction((tx) => {
    const replay = findSaleCreateReplay(tx, payload);
    if (replay) return replay;

    const syncedItems: SyncedItems[] = [];
    if (payload.addToAccounting) assertAccountingCustomer(tx, payload.customerId);

    const lastSale = tx.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1).get();
    const nextInvoiceNo = (lastSale?.invoiceNo ?? 0) + 1;
    const finalInvoiceNo = payload.transactionNo ?? nextInvoiceNo;

    const newSale = tx
      .insert(sales)
      .values({
        id: payload.billingId,
        creationToken: payload.creationToken,
        invoiceNo: finalInvoiceNo,
        customerId: payload.customerId,
        notes: payload.notes,
        createdAt: payload.createdAt ?? sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning()
      .get();

    if (!newSale) throw new AppError("Failed to create sale", 500);

    for (const item of payload.items) {
      const newItem = tx
        .insert(saleItems)
        .values({
          id: item.id ?? undefined,
          saleId: newSale.id,
          productId: item.productId,
          name: item.name,
          productSnapshot: item.productSnapshot,
          mrp: item.mrp,
          price: item.price,
          purchasePrice: item.purchasePrice,
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          totalPrice: Math.round((item.price * item.quantity) / 1000),
          checkedQty: item.checkedQty,
          position: item.position
        })
        .returning()
        .get();

      if (newItem.productId) {
        tx.update(products)
          .set({ totalQuantitySold: sql`${products.totalQuantitySold} + ${newItem.quantity}` })
          .where(eq(products.id, newItem.productId))
          .run();
      }
      syncedItems.push({ rowId: item.rowId, id: newItem.id, updatedAt: newItem.updatedAt });
    }

    updateSaleTotals(tx, newSale.id);
    const finalSale = tx.select().from(sales).where(eq(sales.id, newSale.id)).get()!;
    if (payload.addToAccounting && (finalSale.grandTotal ?? 0) > 0) {
      ledgerRepository.upsertSaleEntry(tx, {
        customerId: finalSale.customerId,
        saleId: finalSale.id,
        amountDue: finalSale.grandTotal ?? 0
      });
      ledgerRepository.recomputeOutstanding(tx, finalSale.customerId);
    }

    return {
      billingId: newSale.id,
      transactionNo: finalInvoiceNo,
      syncedItems,
      deletedRowIds: []
    };
  });
};

const syncSaleWithItems = async (saleId: string, payload: SalePayloadData) => {
  return db.transaction((tx) => {
    const existingSale = tx.select().from(sales).where(eq(sales.id, saleId)).get();
    if (!existingSale) throw new AppError(`Sale with id:${saleId} does not exist`, 404);
    assertSaleCanModify(existingSale.recordedAt);
    if (payload.addToAccounting) assertAccountingCustomer(tx, payload.customerId);

    const existingLedger = ledgerRepository.getLedgerEntriesForSale(tx, saleId)[0];
    const oldCustomerId = existingLedger?.customerId ?? existingSale.customerId;
    const syncedItems: SyncedItems[] = [];
    const deletedRowIds: string[] = [];

    for (const item of payload.items) {
      const values = {
        saleId,
        productId: item.productId,
        name: item.name,
        productSnapshot: item.productSnapshot,
        mrp: item.mrp,
        price: item.price,
        purchasePrice: item.purchasePrice,
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        totalPrice: Math.round((item.price * item.quantity) / 1000),
        checkedQty: item.checkedQty,
        position: item.position
      };

      if (item.isDeleted && item.id) {
        const existingItem = tx.select().from(saleItems).where(eq(saleItems.id, item.id)).get();
        if (existingItem && existingItem.saleId !== saleId) {
          throw new AppError("Sale item does not belong to this sale", 409);
        }
        if (!existingItem) {
          deletedRowIds.push(item.rowId);
          continue;
        }
        if (existingItem.productId) {
          tx.update(products)
            .set({
              totalQuantitySold: sql`${products.totalQuantitySold} - ${existingItem.quantity}`
            })
            .where(eq(products.id, existingItem.productId))
            .run();
        }
        tx.delete(saleItems)
          .where(and(eq(saleItems.id, item.id), eq(saleItems.saleId, saleId)))
          .run();
        deletedRowIds.push(item.rowId);
      } else if (item.id) {
        const oldItem = tx.select().from(saleItems).where(eq(saleItems.id, item.id)).get();
        if (!oldItem || oldItem.saleId !== saleId) {
          throw new AppError("Sale item does not belong to this sale", 409);
        }
        const quantityDelta = item.quantity - oldItem.quantity;
        if (oldItem.productId && oldItem.productId !== item.productId) {
          tx.update(products)
            .set({ totalQuantitySold: sql`${products.totalQuantitySold} - ${oldItem.quantity}` })
            .where(eq(products.id, oldItem.productId))
            .run();
          if (item.productId) {
            tx.update(products)
              .set({ totalQuantitySold: sql`${products.totalQuantitySold} + ${item.quantity}` })
              .where(eq(products.id, item.productId))
              .run();
          }
        } else if (item.productId && quantityDelta !== 0) {
          tx.update(products)
            .set({ totalQuantitySold: sql`${products.totalQuantitySold} + ${quantityDelta}` })
            .where(eq(products.id, item.productId))
            .run();
        }
        const updatedItem = tx
          .update(saleItems)
          .set({ ...values, updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
          .where(and(eq(saleItems.id, item.id), eq(saleItems.saleId, saleId)))
          .returning()
          .get();
        syncedItems.push({ rowId: item.rowId, id: item.id, updatedAt: updatedItem.updatedAt });
      } else {
        const newItem = tx.insert(saleItems).values(values).returning().get();
        if (newItem.productId) {
          tx.update(products)
            .set({ totalQuantitySold: sql`${products.totalQuantitySold} + ${newItem.quantity}` })
            .where(eq(products.id, newItem.productId))
            .run();
        }
        syncedItems.push({ rowId: item.rowId, id: newItem.id, updatedAt: newItem.updatedAt });
      }
    }

    updateSaleTotals(tx, saleId);
    tx.update(sales)
      .set({
        customerId: payload.customerId,
        notes: payload.notes,
        createdAt: payload.createdAt,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .where(eq(sales.id, saleId))
      .run();

    const finalSale = tx.select().from(sales).where(eq(sales.id, saleId)).get()!;
    if (payload.addToAccounting && (finalSale.grandTotal ?? 0) > 0) {
      ledgerRepository.upsertSaleEntry(tx, {
        customerId: finalSale.customerId,
        saleId,
        amountDue: finalSale.grandTotal ?? 0
      });
    } else {
      ledgerRepository.deleteAllLedgerEntriesForSale(tx, saleId);
    }

    ledgerRepository.recomputeOutstanding(tx, oldCustomerId);
    if (oldCustomerId !== finalSale.customerId) {
      ledgerRepository.recomputeOutstanding(tx, finalSale.customerId);
    }

    return { syncedItems, deletedRowIds };
  });
};

// pass tx in param to be included in the same atomic transaction
const updateSaleTotals = (tx: Tx, saleId: string) => {
  const totals = tx
    .select({
      grandTotal: sum(saleItems.totalPrice).mapWith(Number),
      totalQuantity: sum(saleItems.quantity).mapWith(Number)
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId))
    .get();

  const grandTotal = roundPaisaToNearestRupee(totals?.grandTotal ?? 0);

  tx.update(sales)
    .set({
      grandTotal,
      totalQuantity: totals?.totalQuantity ?? 0
    })
    .where(eq(sales.id, saleId))
    .run();
};

const deleteSaleById = async (id: string) => {
  return db.transaction((tx) => {
    const existingSale = tx.select().from(sales).where(eq(sales.id, id)).get();

    if (!existingSale) {
      throw new AppError(`Sale with id:${id} does not exists`, 400);
    }
    assertSaleCanModify(existingSale.recordedAt);

    const items = tx.select().from(saleItems).where(eq(saleItems.saleId, id)).all();

    for (const item of items) {
      if (item.productId) {
        tx.update(products)
          .set({
            totalQuantitySold: sql`${products.totalQuantitySold} - ${item.quantity}`
          })
          .where(eq(products.id, item.productId))
          .run();
      }
    }

    ledgerRepository.deleteAllLedgerEntriesForSale(tx, id);
    ledgerRepository.recomputeOutstanding(tx, existingSale.customerId);

    const result = tx.delete(sales).where(eq(sales.id, id)).run();
    if (result.changes === 0) {
      throw new AppError("Failed to delete sale record", 400);
    }
    return result;
  });
};

// TODO: refactor logic & create utility func (Temporary solution)
const updateCheckedQty = async (saleItemId: string, action: UpdateQtyAction) => {
  db.transaction((tx) => {
    const item = tx.select().from(saleItems).where(eq(saleItems.id, saleItemId)).get();
    if (!item) {
      throw new AppError("Sale Item not found", 400);
    }
    const sale = tx.select().from(sales).where(eq(sales.id, item.saleId)).get();
    if (!sale) throw new AppError("Sale not found", 404);
    assertSaleCanModify(sale.recordedAt);

    if (action === UPDATE_QTY_ACTION.SET) {
      tx.update(saleItems)
        .set({
          checkedQty: item.quantity === item.checkedQty ? 0 : item.quantity
        })
        .where(eq(saleItems.id, saleItemId))
        .run();
      return;
    }

    const updatedQty = updateCheckedQuantityUtil(
      action,
      fromMilliUnits(item.quantity),
      fromMilliUnits(item.checkedQty ?? 0)
    );

    tx.update(saleItems)
      .set({
        checkedQty: toMilliUnits(updatedQty)
      })
      .where(eq(saleItems.id, saleItemId))
      .run();
  });
};

const batchCheckItems = async (saleId: string, action: BatchCheckAction) => {
  return db.transaction((tx) => {
    const sale = tx.select().from(sales).where(eq(sales.id, saleId)).get();
    if (!sale) throw new AppError("Sale not found", 404);
    assertSaleCanModify(sale.recordedAt);

    const setCheckedQty = action === BATCH_CHECK_ACTION.MARK_ALL ? sql`${saleItems.quantity}` : 0;
    return tx
      .update(saleItems)
      .set({ checkedQty: setCheckedQty })
      .where(eq(saleItems.saleId, saleId))
      .run();
  });
};

const duplicateSaleById = async (id: string) => {
  return db.transaction((tx) => {
    const originalSale = tx.select().from(sales).where(eq(sales.id, id)).get();
    if (!originalSale) {
      throw new AppError(`Sale with id:${id} does not exist`, 404);
    }
    const originalItems = tx.select().from(saleItems).where(eq(saleItems.saleId, id)).all();

    const lastSale = tx.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1).get();
    const nextInvoiceNo = (lastSale?.invoiceNo ?? 0) + 1;

    const newSale = tx
      .insert(sales)
      .values({
        invoiceNo: nextInvoiceNo,
        customerId: originalSale.customerId,
        grandTotal: originalSale.grandTotal,
        totalQuantity: originalSale.totalQuantity,
        notes: originalSale.notes,
        createdAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning()
      .get();

    if (!newSale || !newSale.id) {
      throw new AppError("Failed to Create Duplicate Sale", 500);
    }

    for (const item of originalItems) {
      const values = {
        saleId: newSale.id,
        productId: item.productId,
        name: item.name,
        productSnapshot: item.productSnapshot,
        mrp: item.mrp,
        price: item.price,
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        checkedQty: 0,
        position: item.position
      };

      const newItem = tx.insert(saleItems).values(values).returning().get();

      if (newItem.productId) {
        tx.update(products)
          .set({
            totalQuantitySold: sql`${products.totalQuantitySold} + ${newItem.quantity}`
          })
          .where(eq(products.id, newItem.productId))
          .run();
      }
    }

    return {
      id: newSale.id,
      invoiceNo: nextInvoiceNo
    };
  });
};

export const salesRepository = {
  getSaleById,
  getLatestInvoiceNo,
  filterSalesByDate,
  createSale,
  syncSaleWithItems,
  updateCheckedQty,
  batchCheckItems,
  updateSaleTotals,
  deleteSaleById,
  duplicateSaleById
};
