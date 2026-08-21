import { and, asc, count, desc, eq, gte, inArray, lte, or, sql, sum, type SQL } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  BATCH_CHECK_ACTION,
  UPDATE_QTY_ACTION,
  type BatchCheckAction,
  type SyncedItems,
  type SyncResponse,
  type TxnPayloadData,
  type UpdateQtyAction
} from "../../../shared/types";
import { fromMilliUnits, toMilliUnits } from "../../../shared/utils/milliUnits";
import { db } from "../../db/db";
import type * as schema from "../../db/schema";
import { customers, estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { updateCheckedQuantityUtil } from "../../utils/product.utils";
import type { FilterEstimatesParams } from "./estimates.types";

type Tx = BetterSQLite3Database<typeof schema>;
type EstimatePayloadData = Extract<TxnPayloadData, { transactionType: "estimate" }>;

const getEstimateById = async (id: string) => {
  return await db.query.estimates.findFirst({
    where: eq(estimates.id, id),
    with: {
      customer: true,
      estimateItems: {
        orderBy: [asc(estimateItems.position), asc(estimateItems.createdAt)]
      }
    }
  });
};

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const buildEstimateSearchFilter = (search: string): SQL | undefined => {
  if (!search) return undefined;

  const customerNamePattern = `%${escapeLikePattern(search.toLowerCase())}%`;
  const customerMatches = inArray(
    estimates.customerId,
    db
      .select({ id: customers.id })
      .from(customers)
      .where(sql`lower(${customers.name}) like ${customerNamePattern} escape '\\'`)
  );
  const documentSearch = search.startsWith("#") ? search.slice(1) : search;

  if (!/^\d+$/.test(documentSearch)) return customerMatches;

  const documentNumber = Number(documentSearch);
  return Number.isSafeInteger(documentNumber)
    ? or(customerMatches, eq(estimates.estimateNo, documentNumber))
    : customerMatches;
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
  const searchFilter = buildEstimateSearchFilter(params.search);
  const whereClause = and(
    gte(estimates.createdAt, params.from),
    lte(estimates.createdAt, params.to),
    searchFilter
  );

  const [summaryResult, transactionsResult] = await Promise.all([
    db
      .select({
        totalRevenue: sum(estimates.grandTotal).mapWith(Number),
        totalTransactions: count(estimates.id).mapWith(Number)
      })
      .from(estimates)
      .where(whereClause)
      .orderBy(params.orderByClause),

    db.query.estimates.findMany({
      where: whereClause,
      with: {
        customer: true
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
// example: the same id and token return the saved estimate instead of making a duplicate.
const findEstimateCreateReplay = (tx: Tx, payload: EstimatePayloadData) => {
  if (!payload.billingId && !payload.creationToken) return null;
  if (!payload.billingId || !payload.creationToken) {
    throw new AppError("Estimate creation identity is incomplete", 409);
  }

  const estimateById = tx.select().from(estimates).where(eq(estimates.id, payload.billingId)).get();
  const estimateByToken = tx
    .select()
    .from(estimates)
    .where(eq(estimates.creationToken, payload.creationToken))
    .get();

  if (!estimateById && !estimateByToken) return null;
  if (!estimateById || !estimateByToken || estimateById.id !== estimateByToken.id) {
    throw new AppError("Estimate creation identity conflicts with an existing estimate", 409);
  }

  const persistedItems = tx
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, estimateById.id))
    .orderBy(asc(estimateItems.position), asc(estimateItems.createdAt))
    .all();
  const requestedItems = payload.items.filter((item) => !item.isDeleted);
  if (persistedItems.length !== requestedItems.length) {
    throw new AppError("Estimate replay does not match the original request", 409);
  }

  const claimedItemIds = new Set<string>();
  const syncedItems = requestedItems.map((item, index) => {
    const persistedItem = item.id
      ? persistedItems.find((candidate) => candidate.id === item.id)
      : persistedItems[index];
    if (!persistedItem || claimedItemIds.has(persistedItem.id)) {
      throw new AppError("Estimate replay does not match the original request", 409);
    }
    claimedItemIds.add(persistedItem.id);
    return { rowId: item.rowId, id: persistedItem.id, updatedAt: persistedItem.updatedAt };
  });

  return {
    billingId: estimateById.id,
    transactionNo: estimateById.estimateNo,
    syncedItems,
    deletedRowIds: []
  };
};

const createEstimate = async (payload: EstimatePayloadData): Promise<SyncResponse> => {
  return db.transaction((tx) => {
    const replay = findEstimateCreateReplay(tx, payload);
    if (replay) return replay;

    const syncedItems: SyncedItems[] = [];

    const lastEstimate = tx
      .select()
      .from(estimates)
      .orderBy(desc(estimates.estimateNo))
      .limit(1)
      .get();
    const nextEstimateNo = (lastEstimate?.estimateNo ?? 0) + 1;
    const finalEstimateNo = payload.transactionNo ?? nextEstimateNo;

    const newEstimate = tx
      .insert(estimates)
      .values({
        id: payload.billingId,
        creationToken: payload.creationToken,
        estimateNo: finalEstimateNo,
        customerId: payload.customerId,
        notes: payload.notes,
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
        checkedQty: item.checkedQty,
        position: item.position
      };

      // insert new
      const newItem = tx
        .insert(estimateItems)
        .values({ ...values, id: item.id ?? undefined })
        .returning()
        .get();

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
      transactionNo: finalEstimateNo,
      syncedItems: syncedItems,
      deletedRowIds: []
    };
  });
};

const syncEstimateWithItems = async (estimateId: string, payload: EstimatePayloadData) => {
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
        checkedQty: item.checkedQty,
        position: item.position
      };

      if (item.isDeleted && item.id) {
        const existingItem = tx
          .select()
          .from(estimateItems)
          .where(eq(estimateItems.id, item.id))
          .get();
        if (existingItem && existingItem.estimateId !== estimateId) {
          throw new AppError("Estimate item does not belong to this estimate", 409);
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

        // delete item
        tx.delete(estimateItems)
          .where(and(eq(estimateItems.id, item.id), eq(estimateItems.estimateId, estimateId)))
          .run();
        deletedRowIds.push(item.rowId);
      } else {
        if (item.id) {
          // update existing
          const oldItem = tx
            .select()
            .from(estimateItems)
            .where(eq(estimateItems.id, item.id))
            .get();

          if (!oldItem || oldItem.estimateId !== estimateId) {
            throw new AppError("Estimate item does not belong to this estimate", 409);
          }

          const oldQty = oldItem.quantity;
          const newQty = item.quantity;
          const quantityDelta = newQty - oldQty;

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
            .where(and(eq(estimateItems.id, item.id), eq(estimateItems.estimateId, estimateId)))
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
        notes: payload.notes,
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
        notes: estimate.notes
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
          checkedQty: i.checkedQty ?? 0,
          position: i.position
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
  const estimate = db
    .select({ id: estimates.id })
    .from(estimates)
    .where(eq(estimates.id, estimateId))
    .get();
  if (!estimate) {
    throw new AppError("Estimate not found", 404);
  }

  const setCheckedQty = action === BATCH_CHECK_ACTION.MARK_ALL ? sql`${estimateItems.quantity}` : 0;

  return db
    .update(estimateItems)
    .set({
      checkedQty: setCheckedQty
    })
    .where(eq(estimateItems.estimateId, estimateId))
    .run();
};

const duplicateEstimateById = async (id: string) => {
  return db.transaction((tx) => {
    const originalEstimate = tx.select().from(estimates).where(eq(estimates.id, id)).get();
    if (!originalEstimate) {
      throw new AppError(`Estimate with id:${id} does not exist`, 404);
    }
    const originalItems = tx
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, id))
      .all();

    const lastEstimate = tx
      .select()
      .from(estimates)
      .orderBy(desc(estimates.estimateNo))
      .limit(1)
      .get();
    const nextEstimateNo = (lastEstimate?.estimateNo ?? 0) + 1;

    const newEstimate = tx
      .insert(estimates)
      .values({
        estimateNo: nextEstimateNo,
        customerId: originalEstimate.customerId,
        grandTotal: originalEstimate.grandTotal,
        totalQuantity: originalEstimate.totalQuantity,
        notes: originalEstimate.notes,
        createdAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning()
      .get();

    if (!newEstimate || !newEstimate.id) {
      throw new AppError("Failed to Create Duplicate Estimate", 500);
    }

    for (const item of originalItems) {
      const values = {
        estimateId: newEstimate.id,
        productId: item.productId,
        name: item.name,
        productSnapshot: item.productSnapshot,
        mrp: item.mrp,
        price: item.price,
        purchasePrice: item.purchasePrice,
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        checkedQty: 0,
        position: item.position
      };

      const newItem = tx.insert(estimateItems).values(values).returning().get();

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
      id: newEstimate.id,
      estimateNo: nextEstimateNo
    };
  });
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
  deleteEstimateById,
  duplicateEstimateById
};
