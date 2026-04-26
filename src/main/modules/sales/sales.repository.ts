import { and, count, desc, eq, gte, lte, sql, sum, type SQL } from "drizzle-orm";
import {
  BATCH_CHECK_ACTION,
  UPDATE_QTY_ACTION,
  type BatchCheckAction,
  type SyncedItems,
  type TxnPayloadData,
  type UpdateQtyAction
} from "../../../shared/types";
import { fromMilliUnits, toMilliUnits } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { updateCheckedQuantityUtil } from "../../utils/product.utils";
import type { FilterSalesParams } from "./sales.types";

const getSaleById = async (id: string) => {
  return await db.query.sales.findFirst({
    where: eq(sales.id, id),
    with: {
      customer: true,
      saleItems: true
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
    const newSale = tx
      .insert(sales)
      .values({
        invoiceNo: Number(payload.transactionNo),
        customerId: payload.customerId
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
        checkedQty: item.checkedQty
      };

      // insert new
      const newItem = tx.insert(saleItems).values(values).returning().get();

      if (newItem.productId) {
        tx.update(products)
          .set({
            totalQuantitySold: newItem.quantity
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

    return {
      billingId: newSale.id,
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
        checkedQty: item.checkedQty
      };

      if (item.isDeleted && item.id) {
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
                totalQuantitySold: newItem.quantity
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
        createdAt: payload.createdAt,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .where(eq(sales.id, saleId))
      .run();

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

  tx.update(sales)
    .set({
      grandTotal: totals?.grandTotal ?? 0,
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
        isPaid: true
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
          checkedQty: i.checkedQty ?? 0
        })
        .run();
    });

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
  updateSaleStatus
};
