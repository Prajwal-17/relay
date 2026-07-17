import { and, asc, count, desc, eq, gte, lte, sql, sum, type SQL } from "drizzle-orm";
import {
  BATCH_CHECK_ACTION,
  UPDATE_QTY_ACTION,
  type BatchCheckAction,
  type SyncedItems,
  type TxnPayloadData,
  type UpdateQtyAction
} from "../../../shared/types";
import { fromMilliUnits, toMilliUnits } from "../../../shared/utils/milliUnits";
import { db } from "../../db/db";
import { estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { updateCheckedQuantityUtil } from "../../utils/product.utils";
import { ledgerRepository } from "../ledger/ledger.repository";
import type { FilterSalesParams } from "./sales.types";

const getSaleById = async (id: string) => {
  return await db.query.sales.findFirst({
    where: eq(sales.id, id),
    with: {
      customer: true,
      saleItems: {
        orderBy: [asc(saleItems.position), asc(saleItems.createdAt)]
      }
    }
  });
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

  const [summaryResult, transactionsResult] = await Promise.all([
    db
      .select({
        totalRevenue: sum(sales.grandTotal).mapWith(Number),
        totalTransactions: count(sales.id).mapWith(Number)
      })
      .from(sales)
      .where(and(gte(sales.createdAt, params.from), lte(sales.createdAt, params.to)))
      .orderBy(params.orderByClause),

    db.query.sales.findMany({
      where: and(gte(sales.createdAt, params.from), lte(sales.createdAt, params.to)),
      with: {
        customer: true
      },
      orderBy: params.orderByClause,
      limit: 20,
      offset: offset
    })
  ]);

  return {
    summaryResult,
    transactionsResult
  };
};

const createSale = async (payload: TxnPayloadData) => {
  return db.transaction((tx) => {
    const syncedItems: SyncedItems[] = [];

    const lastSale = tx.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1).get();
    const nextInvoiceNo = (lastSale?.invoiceNo ?? 0) + 1;
    const finalInvoiceNo = payload.transactionNo ?? nextInvoiceNo;

    const newSale = tx
      .insert(sales)
      .values({
        invoiceNo: finalInvoiceNo,
        customerId: payload.customerId,
        amountPaid: payload.amountPaid ?? 0,
        paymentMode: payload.paymentMode ?? null,
        isPaid: false,
        notes: payload.notes,
        createdAt: payload.createdAt
          ? payload.createdAt
          : sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning()
      .get();

    if (!newSale || !newSale.id) {
      throw new AppError("Failed to Create Sale", 500);
    }

    for (const item of payload.items) {
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
        totalPrice: Math.round((item.price * item.quantity) / 1000),
        checkedQty: item.checkedQty,
        position: item.position
      };

      // insert new
      const newItem = tx.insert(saleItems).values(values).returning().get();

      if (newItem.productId) {
        tx.update(products)
          .set({
            totalQuantitySold: sql`${products.totalQuantitySold} + ${newItem.quantity}`
          })
          .where(eq(products.id, newItem.productId))
          .run();
      }

      syncedItems.push({
        rowId: item.rowId,
        id: newItem.id,
        updatedAt: newItem.updatedAt
      });
    }

    updateSaleTotals(tx, newSale.id);

    tx.update(sales)
      .set({
        amountPaid: sql`MIN(${sales.amountPaid}, COALESCE(${sales.grandTotal}, 0))`
      })
      .where(eq(sales.id, newSale.id))
      .run();

    const finalSale = tx.select().from(sales).where(eq(sales.id, newSale.id)).get()!;
    const cappedPaid = Math.min(finalSale.amountPaid ?? 0, finalSale.grandTotal ?? 0);

    if ((finalSale.grandTotal ?? 0) > 0) {
      ledgerRepository.upsertSaleEntry(tx, {
        customerId: finalSale.customerId,
        saleId: finalSale.id,
        amountDue: finalSale.grandTotal ?? 0
      });
      ledgerRepository.upsertPaymentForSale(tx, {
        saleId: finalSale.id,
        customerId: finalSale.customerId,
        amountPaid: cappedPaid,
        paymentMode: finalSale.paymentMode
      });
    } else {
      ledgerRepository.deleteAllLedgerEntriesForSale(tx, finalSale.id);
    }
    ledgerRepository.recomputeOutstanding(tx, finalSale.customerId);

    return {
      billingId: newSale.id,
      transactionNo: finalInvoiceNo,
      syncedItems: syncedItems,
      deletedRowIds: []
    };
  });
};

const syncSaleWithItems = async (saleId: string, payload: TxnPayloadData) => {
  return db.transaction((tx) => {
    const syncedItems: SyncedItems[] = [];
    const deletedRowIds: string[] = [];

    for (const item of payload.items) {
      const values = {
        saleId: saleId,
        productId: item.productId,
        name: item.name,
        productSnapshot: item.productSnapshot,
        mrp: item.mrp,
        price: item.price,
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        totalPrice: Math.round((item.price * item.quantity) / 1000),
        checkedQty: item.checkedQty,
        position: item.position
      };

      if (item.isDeleted && item.id) {
        const existingItem = tx.select().from(saleItems).where(eq(saleItems.id, item.id)).get();

        if (existingItem?.productId) {
          tx.update(products)
            .set({
              totalQuantitySold: sql`${products.totalQuantitySold} - ${existingItem.quantity}`
            })
            .where(eq(products.id, existingItem.productId))
            .run();
        }

        // delete item
        tx.delete(saleItems).where(eq(saleItems.id, item.id)).run();
        deletedRowIds.push(item.rowId);
      } else {
        if (item.id) {
          // update existing
          const oldItem = tx.select().from(saleItems).where(eq(saleItems.id, item.id)).get();

          if (!oldItem) {
            continue;
          }

          const oldQty = oldItem.quantity;
          const newQty = item.quantity;
          const quantityDelta = newQty - oldQty;

          if (item.productId && quantityDelta !== 0) {
            tx.update(products)
              .set({
                totalQuantitySold: sql`${products.totalQuantitySold}+ ${quantityDelta}`
              })
              .where(eq(products.id, item.productId))
              .run();
          }

          const updatedItem = tx
            .update(saleItems)
            .set({
              ...values,
              updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            })
            .where(eq(saleItems.id, item.id))
            .returning()
            .get();

          syncedItems.push({
            rowId: item.rowId,
            id: item.id,
            updatedAt: updatedItem.updatedAt
          });
        } else {
          // insert new
          const newItem = tx.insert(saleItems).values(values).returning().get();

          if (newItem.productId) {
            tx.update(products)
              .set({
                totalQuantitySold: sql`${products.totalQuantitySold} + ${newItem.quantity}`
              })
              .where(eq(products.id, newItem.productId))
              .run();
          }

          syncedItems.push({
            rowId: item.rowId,
            id: newItem.id,
            updatedAt: newItem.updatedAt
          });
        }
      }
    }

    updateSaleTotals(tx, saleId);

    tx.update(sales)
      .set({
        customerId: payload.customerId,
        amountPaid: sql`MIN(${payload.amountPaid ?? 0}, COALESCE(${sales.grandTotal}, 0))`,
        paymentMode: payload.paymentMode ?? null,
        notes: payload.notes,
        createdAt: payload.createdAt,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .where(eq(sales.id, saleId))
      .run();

    const finalSale = tx.select().from(sales).where(eq(sales.id, saleId)).get()!;
    const existingLedgerRows = ledgerRepository.getLedgerEntriesForSale(tx, saleId);
    const oldCustomerId = existingLedgerRows[0]?.customerId ?? finalSale.customerId;
    const cappedPaid = Math.min(finalSale.amountPaid ?? 0, finalSale.grandTotal ?? 0);

    if ((finalSale.grandTotal ?? 0) > 0) {
      ledgerRepository.upsertSaleEntry(tx, {
        customerId: finalSale.customerId,
        saleId,
        amountDue: finalSale.grandTotal ?? 0
      });
      ledgerRepository.upsertPaymentForSale(tx, {
        saleId,
        customerId: finalSale.customerId,
        amountPaid: cappedPaid,
        paymentMode: finalSale.paymentMode
      });
    } else {
      ledgerRepository.deleteAllLedgerEntriesForSale(tx, saleId);
    }

    if (oldCustomerId !== finalSale.customerId) {
      ledgerRepository.recomputeOutstanding(tx, oldCustomerId);
    }
    ledgerRepository.recomputeOutstanding(tx, finalSale.customerId);

    return {
      syncedItems,
      deletedRowIds
    };
  });
};

// pass tx in param to be included in the same atomic transaction
const updateSaleTotals = async (tx: any, saleId: string) => {
  const totals = tx
    .select({
      grandTotal: sum(saleItems.totalPrice).mapWith(Number),
      totalQuantity: sum(saleItems.quantity).mapWith(Number)
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId))
    .get();

  const grandTotal = totals?.grandTotal ?? 0;

  tx.update(sales)
    .set({
      grandTotal,
      totalQuantity: totals?.totalQuantity ?? 0,
      isPaid: sql`CASE WHEN ${grandTotal} > 0 AND ${sales.amountPaid} >= ${grandTotal} THEN 1 ELSE 0 END`
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

const convertSaleToEstimate = async (id: string) => {
  return db.transaction((tx) => {
    const sale = tx.select().from(sales).where(eq(sales.id, id)).get();

    if (!sale) {
      throw new AppError(`Sale with id:${id} does not exist`, 400);
    }

    const currentSaleItems = tx.select().from(saleItems).where(eq(saleItems.saleId, id)).all(); // Returns SaleItems[]

    const lastEstimate = tx
      .select()
      .from(estimates)
      .orderBy(desc(estimates.estimateNo))
      .limit(1)
      .all();

    const nextEstimateNo = (lastEstimate[0]?.estimateNo ?? 0) + 1;

    const newEstimate = tx
      .insert(estimates)
      .values({
        estimateNo: nextEstimateNo,
        customerId: sale.customerId,
        grandTotal: sale.grandTotal,
        totalQuantity: sale.totalQuantity,
        isPaid: true,
        notes: sale.notes
      })
      .returning({ id: estimates.id })
      .get();

    if (!newEstimate) {
      throw new AppError("Could not convert Sale to Estimate", 500);
    }

    currentSaleItems.forEach((i) => {
      tx.insert(estimateItems)
        .values({
          estimateId: newEstimate.id,
          productId: i.productId,
          name: i.name,
          productSnapshot: i.productSnapshot,
          mrp: i.mrp,
          price: i.price,
          purchasePrice: i.purchasePrice,
          weight: i.weight,
          unit: i.unit,
          quantity: i.quantity,
          totalPrice: i.totalPrice,
          checkedQty: i.checkedQty ?? 0,
          position: i.position
        })
        .run();
    });

    ledgerRepository.deleteAllLedgerEntriesForSale(tx, id);
    ledgerRepository.recomputeOutstanding(tx, sale.customerId);

    const result = tx.delete(sales).where(eq(sales.id, id)).run();

    if (result.changes === 0) {
      throw new AppError("Could not convert Sale to Estimate", 400);
    }

    return newEstimate;
  });
};

// TODO: refactor logic & create utility func (Temporary solution)
const updateCheckedQty = async (saleItemId: string, action: UpdateQtyAction) => {
  db.transaction((tx) => {
    const item = tx.select().from(saleItems).where(eq(saleItems.id, saleItemId)).get();
    if (!item) {
      throw new AppError("Sale Item not found", 400);
    }

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
  const setCheckedQty = action === BATCH_CHECK_ACTION.MARK_ALL ? sql`${saleItems.quantity}` : 0;

  return db
    .update(saleItems)
    .set({
      checkedQty: setCheckedQty
    })
    .where(eq(saleItems.saleId, saleId))
    .run();
};

const updateSaleStatus = async (id: string, isPaid: boolean) => {
  return db
    .update(sales)
    .set({
      isPaid: isPaid
    })
    .where(and(eq(sales.id, id), eq(sales.isPaid, !isPaid)))
    .run();
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
        amountPaid: 0,
        paymentMode: null,
        isPaid: false,
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

    ledgerRepository.upsertSaleEntry(tx, {
      customerId: newSale.customerId,
      saleId: newSale.id,
      amountDue: newSale.grandTotal ?? 0
    });
    ledgerRepository.recomputeOutstanding(tx, newSale.customerId);

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
  convertSaleToEstimate,
  updateCheckedQty,
  batchCheckItems,
  updateSaleTotals,
  deleteSaleById,
  updateSaleStatus,
  duplicateSaleById
};
