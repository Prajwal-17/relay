import { and, count, desc, eq, gte, lte, notInArray, sql, type SQL, sum } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import type { CreateSaleParams, FilterSalesParams, UpdateSaleParams } from "./sales.types";

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

const createSale = async (customerId, payload: CreateSaleParams) => {
  return db.transaction((tx) => {
    const newSale = tx
      .insert(sales)
      .values({
        invoiceNo: Number(payload.transactionNo),
        customerId: customerId,
        grandTotal: payload.grandTotal,
        totalQuantity: payload.totalQuantity,
        isPaid: payload.isPaid,
        createdAt: payload.createdAt
          ? payload.createdAt
          : sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      })
      .returning({ id: sales.id })
      .get();

    if (!newSale || !newSale.id) {
      throw new Error("Failed to Create Sale");
    }

    for (const item of payload.items) {
      if (!item.name) {
        throw new Error("Item name field cannot be empty");
      }

      tx.insert(saleItems)
        .values({
          saleId: newSale.id,
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

    return newSale.id;
    // return "Successfully created Sale";
  });
};

const updateSale = async (saleId: string, payload: UpdateSaleParams) => {
  return db.transaction((tx) => {
    // update sale
    tx.update(sales)
      .set({
        // customerId
        grandTotal: payload.grandTotal,
        isPaid: payload.isPaid,
        totalQuantity: payload.totalQuantity,
        updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))`
      })
      .where(eq(sales.id, saleId))
      .run();

    const resultItems: any = [];

    const quantitySoldAdjustments = new Map<string, number>();

    const existingSaleItems = tx.select().from(saleItems).where(eq(saleItems.saleId, saleId)).all();

    for (const saleItem of existingSaleItems) {
      if (saleItem.productId) {
        const current = quantitySoldAdjustments.get(saleItem.productId) || 0;
        quantitySoldAdjustments.set(saleItem.productId, current - saleItem.quantity);
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
        saleId: saleId,
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
        // update sale item
        dbItem = tx
          .update(saleItems)
          .set(values)
          .where(eq(saleItems.id, item.id))
          .returning()
          .get();
      } else {
        // insert new
        dbItem = tx.insert(saleItems).values(values).returning().get();
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
      tx.delete(saleItems)
        .where(and(eq(saleItems.saleId, saleId), notInArray(saleItems.id, keptItemIds)))
        .run();
    } else {
      // delete all items if item array is empty
      tx.delete(saleItems).where(eq(saleItems.saleId, saleId)).run();
    }

    return {
      ...payload,
      items: resultItems
    };
  });
};

const deleteSaleById = async (id: string) => {
  return db.transaction((tx) => {
    const existingSale = tx.select().from(sales).where(eq(sales.id, id)).get();

    if (!existingSale) {
      throw new Error(`Sale with id:${id} does not exists`);
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
      throw new Error("Failed to delete sale record");
    }
    return result;
  });
};

const convertSaleToEstimate = async (id: string) => {
  return db.transaction((tx) => {
    const sale = tx.select().from(sales).where(eq(sales.id, id)).get();

    if (!sale) {
      throw new Error(`Sale with id:${id} does not exist`);
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
        isPaid: false
      })
      .returning({ id: estimates.id })
      .get();

    if (!newEstimate) {
      throw new Error("Could not convert Sale to Estimate");
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
      throw new Error("Could not convert Sale to Estimate");
    }

    return result;
  });
};

export const salesRepository = {
  getSaleById,
  getLatestInvoiceNo,
  filterSalesByDate,
  createSale,
  updateSale,
  convertSaleToEstimate,
  deleteSaleById
};
