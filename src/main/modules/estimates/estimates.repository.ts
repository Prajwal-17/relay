import { and, count, desc, eq, gte, lte, sql, sum, type SQL } from "drizzle-orm";
import {
  BATCH_CHECK_ACTION,
  UPDATE_QTY_ACTION,
  type BatchCheckAction,
  type SyncedItems,
  type SyncResponse,
  type TxnPayloadData,
  type UpdateQtyAction
} from "../../../shared/types";
import { fromMilliUnits, toMilliUnits } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { updateCheckedQuantityUtil } from "../../utils/product.utils";
import type { FilterEstimatesParams } from "./estimates.types";

const getEstimateById = async (id: string) => {
  return await db.query.estimates.findFirst({
    where: eq(estimates.id, id),
    with: {
      customer: true,
      estimateItems: true
    }
  });
};

const getLatestEstimateNo = async () => {
  return db.select().from(estimates).orderBy(desc(estimates.estimateNo)).limit(1).get();
};

const filterEstimatesByDate = async (
  params: Omit<FilterEstimatesParams, "sortBy"> & {
    orderByClause: SQL;
  }
) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  const [summaryResult, transactionsResult] = await Promise.all([
    db
      .select({
        totalRevenue: sum(estimates.grandTotal).mapWith(Number),
        totalTransactions: count(estimates.id).mapWith(Number)
      })
      .from(estimates)
      .where(and(gte(estimates.createdAt, params.from), lte(estimates.createdAt, params.to)))
      .orderBy(params.orderByClause),

    db.query.estimates.findMany({
      where: and(gte(estimates.createdAt, params.from), lte(estimates.createdAt, params.to)),
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

const createEstimate = async (payload: TxnPayloadData): Promise<SyncResponse> => {
  return db.transaction((tx) => {
    const syncedItems: SyncedItems[] = [];
    const newEstimate = tx
      .insert(estimates)
      .values({
        estimateNo: Number(payload.transactionNo),
        customerId: payload.customerId,
        isPaid: payload.isPaid,
        createdAt: payload.createdAt
          ? payload.createdAt
          : sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning()
      .get();

    if (!newEstimate || !newEstimate.id) {
      throw new AppError("Failed to Create Estimate", 500);
    }

    for (const item of payload.items) {
      const values = {
        estimateId: newEstimate.id,
        productId: item.productId ? item.productId : null,
        name: item.name,
        productSnapshot: item.productSnapshot,
        mrp: item.mrp,
        price: item.price,
        purchasePrice: null,
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        totalPrice: Math.round((item.price * item.quantity) / 1000),
        checkedQty: item.checkedQty
      };

      // insert new
      const newItem = tx.insert(estimateItems).values(values).returning().get();

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

    updateEstimateTotals(tx, newEstimate.id);

    return {
      billingId: newEstimate.id,
      syncedItems: syncedItems,
      deletedRowIds: []
    };
  });
};

const syncEstimateWithItems = async (estimateId: string, payload: TxnPayloadData) => {
  return db.transaction((tx) => {
    const syncedItems: SyncedItems[] = [];
    const deletedRowIds: string[] = [];

    for (const item of payload.items) {
      const values = {
        estimateId: estimateId,
        productId: item.productId ? item.productId : null,
        name: item.name,
        productSnapshot: item.productSnapshot,
        mrp: item.mrp,
        price: item.price,
        purchasePrice: null,
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        totalPrice: Math.round((item.price * item.quantity) / 1000),
        checkedQty: item.checkedQty
      };

      if (item.isDeleted && item.id) {
        const existingItem = tx
          .select()
          .from(estimateItems)
          .where(eq(estimateItems.id, item.id))
          .get();

        if (existingItem?.productId) {
          tx.update(products)
            .set({
              totalQuantitySold: sql`${products.totalQuantitySold} - ${existingItem.quantity}`
            })
            .where(eq(products.id, existingItem.productId))
            .run();
        }

        // delete item
        tx.delete(estimateItems).where(eq(estimateItems.id, item.id)).run();
        deletedRowIds.push(item.rowId);
      } else {
        if (item.id) {
          // update existing
          const oldItem = tx
            .select()
            .from(estimateItems)
            .where(eq(estimateItems.id, item.id))
            .get();

          if (!oldItem) {
            continue;
          }

          const oldQty = oldItem.quantity;
          const newQty = item.quantity;
          const quantityDelta = newQty - oldQty;

          if (item.productId && quantityDelta !== 0) {
            tx.update(products)
              .set({
                totalQuantitySold: sql`${products.totalQuantitySold} + ${quantityDelta}`
              })
              .where(eq(products.id, item.productId))
              .run();
          }

          const updatedItem = tx
            .update(estimateItems)
            .set({
              ...values,
              updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            })
            .where(eq(estimateItems.id, item.id))
            .returning()
            .get();

          syncedItems.push({
            rowId: item.rowId,
            id: item.id,
            updatedAt: updatedItem.updatedAt
          });
        } else {
          // insert new
          const newItem = tx.insert(estimateItems).values(values).returning().get();

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

    updateEstimateTotals(tx, estimateId);

    tx.update(estimates)
      .set({
        customerId: payload.customerId,
        isPaid: payload.isPaid,
        createdAt: payload.createdAt,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .where(eq(estimates.id, estimateId))
      .run();

    return {
      syncedItems,
      deletedRowIds
    };
  });
};

// pass tx in param to be included in the same atomic transaction
const updateEstimateTotals = async (tx: any, estimateId: string) => {
  const totals = tx
    .select({
      grandTotal: sum(estimateItems.totalPrice).mapWith(Number),
      totalQuantity: sum(estimateItems.quantity).mapWith(Number)
    })
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, estimateId))
    .get();

  tx.update(estimates)
    .set({
      grandTotal: totals?.grandTotal ?? 0,
      totalQuantity: totals?.totalQuantity ?? 0
    })
    .where(eq(estimates.id, estimateId))
    .run();
};

const deleteEstimateById = async (id: string) => {
  return db.transaction((tx) => {
    const existingEstimate = tx.select().from(estimates).where(eq(estimates.id, id)).get();

    if (!existingEstimate) {
      throw new AppError(`Estimate with id:${id} does not exists`, 400);
    }

    const items = tx.select().from(estimateItems).where(eq(estimateItems.estimateId, id)).all();

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

    const result = tx.delete(estimates).where(eq(estimates.id, id)).run();
    if (result.changes === 0) {
      throw new AppError("Failed to delete Estimate record", 400);
    }
    return result;
  });
};

const convertEstimateToSale = async (id: string) => {
  return db.transaction((tx) => {
    const estimate = tx.select().from(estimates).where(eq(estimates.id, id)).get();

    if (!estimate) {
      throw new AppError(`Estimate with id:${id} does not exist`, 400);
    }

    const currentEstimateItems = tx
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, id))
      .all(); // Returns estimateItems[]

    const lastSale = tx.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1).all();

    const nextSaleNo = (lastSale[0]?.invoiceNo ?? 0) + 1;

    const newSale = tx
      .insert(sales)
      .values({
        invoiceNo: nextSaleNo,
        customerId: estimate.customerId,
        grandTotal: estimate.grandTotal,
        totalQuantity: estimate.totalQuantity,
        isPaid: false
      })
      .returning({ id: sales.id })
      .get();

    if (!newSale) {
      throw new AppError("Could not convert Estimate to Sale", 500);
    }

    currentEstimateItems.forEach((i) => {
      tx.insert(saleItems)
        .values({
          saleId: newSale.id,
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

    const result = tx.delete(estimates).where(eq(estimates.id, id)).run();

    if (result.changes === 0) {
      throw new AppError("Could not convert Estimate to Sale", 400);
    }

    return newSale;
  });
};

// TODO: refactor logic & create utility func (Temporary solution)
const updateCheckedQty = async (estimateItemId: string, action: UpdateQtyAction) => {
  db.transaction((tx) => {
    const item = tx.select().from(estimateItems).where(eq(estimateItems.id, estimateItemId)).get();
    if (!item) {
      throw new AppError("Estimate Item not found", 400);
    }

    if (action === UPDATE_QTY_ACTION.SET) {
      tx.update(estimateItems)
        .set({
          checkedQty: item.quantity === item.checkedQty ? 0 : item.quantity
        })
        .where(eq(estimateItems.id, estimateItemId))
        .run();
      return;
    }

    const updatedQty = updateCheckedQuantityUtil(
      action,
      fromMilliUnits(item.quantity),
      fromMilliUnits(item.checkedQty ?? 0)
    );

    tx.update(estimateItems)
      .set({
        checkedQty: toMilliUnits(updatedQty)
      })
      .where(eq(estimateItems.id, estimateItemId))
      .run();
  });
};

const batchCheckItems = async (estimateId: string, action: BatchCheckAction) => {
  const setCheckedQty = action === BATCH_CHECK_ACTION.MARK_ALL ? sql`${estimateItems.quantity}` : 0;

  return db
    .update(estimateItems)
    .set({
      checkedQty: setCheckedQty
    })
    .where(eq(estimateItems.estimateId, estimateId))
    .run();
};

const updateEstimateStatus = async (id: string, isPaid: boolean) => {
  return db
    .update(estimates)
    .set({
      isPaid: isPaid
    })
    .where(and(eq(estimates.id, id), eq(estimates.isPaid, !isPaid)))
    .run();
};

export const estimatesRepository = {
  getEstimateById,
  getLatestEstimateNo,
  filterEstimatesByDate,
  createEstimate,
  syncEstimateWithItems,
  updateEstimateTotals,
  convertEstimateToSale,
  updateCheckedQty,
  batchCheckItems,
  updateEstimateStatus,
  deleteEstimateById
};
