import { and, count, desc, eq, gte, lte, notInArray, sql, sum, type SQL } from "drizzle-orm";
import {
  BATCH_CHECK_ACTION,
  UPDATE_QTY_ACTION,
  type BatchCheckAction,
  type UpdateQtyAction
} from "../../../shared/types";
import { db } from "../../db/db";
import { estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import type {
  CreateEstimateParams,
  FilterEstimatesParams,
  UpdateEstimateParams
} from "./estimates.types";

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

const createEstimate = async (payload: CreateEstimateParams) => {
  return db.transaction((tx) => {
    const newEstimate = tx
      .insert(estimates)
      .values({
        estimateNo: Number(payload.transactionNo),
        customerId: payload.customerId,
        grandTotal: payload.grandTotal,
        totalQuantity: payload.totalQuantity,
        isPaid: payload.isPaid,
        createdAt: payload.createdAt
          ? payload.createdAt
          : sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning({ id: estimates.id })
      .get();

    if (!newEstimate || !newEstimate.id) {
      throw new Error("Failed to Create Estimate");
    }

    for (const item of payload.items) {
      if (!item.name) {
        throw new Error("Item name field cannot be empty");
      }

      tx.insert(estimateItems)
        .values({
          estimateId: newEstimate.id,
          productId: item.productId ? item.productId : null,
          name: item.name,
          productSnapshot: item.productSnapshot,
          mrp: item.mrp,
          price: item.price,
          purchasePrice: item.purchasePrice,
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        })
        .run();

      if (item.productId) {
        tx.update(products)
          .set({
            totalQuantitySold: sql`${products.totalQuantitySold} + ${item.quantity}`
          })
          .where(eq(products.id, item.productId))
          .run();
      }
    }

    return newEstimate.id;
    // return "Successfully created Estimate";
  });
};

const updateEstimate = async (estimateId: string, payload: UpdateEstimateParams) => {
  return db.transaction((tx) => {
    // update estimate
    tx.update(estimates)
      .set({
        customerId: payload.customerId,
        grandTotal: payload.grandTotal,
        isPaid: payload.isPaid,
        totalQuantity: payload.totalQuantity,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))`,
        createdAt: payload.createdAt
      })
      .where(eq(estimates.id, estimateId))
      .run();

    const resultItems: any = [];

    const quantitySoldAdjustments = new Map<string, number>();

    const existingEstimateItems = tx
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, estimateId))
      .all();

    for (const estimateItem of existingEstimateItems) {
      if (estimateItem.productId) {
        const current = quantitySoldAdjustments.get(estimateItem.productId) || 0;
        quantitySoldAdjustments.set(estimateItem.productId, current - estimateItem.quantity);
      }
    }

    for (const item of payload.items) {
      if (item.productId) {
        const current = quantitySoldAdjustments.get(item.productId) || 0;
        quantitySoldAdjustments.set(item.productId, current + item.quantity);
      }
    }

    for (const [productId, netChange] of quantitySoldAdjustments) {
      if (netChange !== 0) {
        tx.update(products)
          .set({
            totalQuantitySold: sql`${products.totalQuantitySold} + ${netChange}`
          })
          .where(eq(products.id, productId))
          .run();
      }
    }

    for (const item of payload.items) {
      const values = {
        estimateId: estimateId,
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
        checkedQty: item.checkedQty
      };

      let dbItem;

      if (item.id) {
        // update estimate item
        dbItem = tx
          .update(estimateItems)
          .set(values)
          .where(eq(estimateItems.id, item.id))
          .returning()
          .get();
      } else {
        // insert new
        dbItem = tx.insert(estimateItems).values(values).returning().get();
      }

      // merge DB result with FE rowId
      resultItems.push({
        ...item, // retain FE props
        ...dbItem, // overwrite with DB props (id)
        rowId: item.rowId // force keep the specific rowId
      });
    }

    const keptItemIds = resultItems.map((item) => item.id);

    // delete items NOT in the payload
    if (keptItemIds.length > 0) {
      tx.delete(estimateItems)
        .where(
          and(eq(estimateItems.estimateId, estimateId), notInArray(estimateItems.id, keptItemIds))
        )
        .run();
    } else {
      // delete all items if item array is empty
      tx.delete(estimateItems).where(eq(estimateItems.estimateId, estimateId)).run();
    }

    return {
      ...payload,
      items: resultItems
    };
  });
};

const deleteEstimateById = async (id: string) => {
  return db.transaction((tx) => {
    const existingEstimate = tx.select().from(estimates).where(eq(estimates.id, id)).get();

    if (!existingEstimate) {
      throw new Error(`Estimate with id:${id} does not exists`);
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
      throw new Error("Failed to delete Estimate record");
    }
    return result;
  });
};

const convertEstimateToSale = async (id: string) => {
  return db.transaction((tx) => {
    const estimate = tx.select().from(estimates).where(eq(estimates.id, id)).get();

    if (!estimate) {
      throw new Error(`Estimate with id:${id} does not exist`);
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
      throw new Error("Could not convert Estimate to Sale");
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
      throw new Error("Could not convert Estimate to Sale");
    }

    return result;
  });
};

const updateCheckedQty = async (estimateItemId: string, action: UpdateQtyAction) => {
  let updatedQty: number | undefined;

  db.transaction((tx) => {
    const item = tx.select().from(estimateItems).where(eq(estimateItems.id, estimateItemId)).get();
    if (!item) {
      throw new Error("Estimate Item not found");
    }
    updatedQty = item.checkedQty ?? 0;
    const totalQty = item.quantity;
    const remainder = parseFloat((totalQty % 1).toFixed(2));
    if (action === UPDATE_QTY_ACTION.SET) {
      updatedQty = item.checkedQty === item.quantity ? 0 : item.quantity;
    } else if (action === UPDATE_QTY_ACTION.INCREMENT) {
      const nextQty = updatedQty + 1;
      if (nextQty > totalQty) {
        const remainderQty = updatedQty + remainder;
        if (remainderQty <= totalQty) {
          updatedQty = remainderQty;
        } else {
          updatedQty = totalQty;
        }
      } else {
        updatedQty = nextQty;
      }
    } else if (action === UPDATE_QTY_ACTION.DECREMENT) {
      const nextQty = updatedQty - 1;
      const remainderVal = parseFloat((updatedQty % 1).toFixed(2));
      if (remainderVal !== 0 && updatedQty === totalQty) {
        updatedQty = Math.floor(updatedQty);
      } else {
        updatedQty = Math.max(0, nextQty);
      }
    }
    updatedQty = Math.round(updatedQty * 100) / 100;
    tx.update(estimateItems)
      .set({
        checkedQty: updatedQty
      })
      .where(eq(estimateItems.id, estimateItemId))
      .run();
  });

  if (updatedQty === undefined) {
    throw new Error("Update failed unexpectedly");
  }

  return updatedQty;
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

export const estimatesRepository = {
  getEstimateById,
  getLatestEstimateNo,
  filterEstimatesByDate,
  createEstimate,
  updateEstimate,
  convertEstimateToSale,
  updateCheckedQty,
  batchCheckItems,
  deleteEstimateById
};
