import { and, count, desc, eq, gte, lte, sql, type SQL, sum } from "drizzle-orm";
import { db } from "../../db/db";
import { estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import type { FilterSalesParams, SalesByCustomerParams } from "./sales.types";

const getSaleById = async (id: string) => {
  return await db.query.sales.findFirst({
    where: eq(sales.id, id),
    with: {
      customer: true,
      saleItems: true
    }
  });
};

const getSalesByCustomerId = async (params: SalesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  return await db.query.sales.findMany({
    where: eq(sales.customerId, params.customerId),
    orderBy: desc(sales.createdAt),
    limit: 20,
    offset: offset
  });
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

    if (items.length === 0) {
      throw new Error("Sale Items does not exist");
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
  getSalesByCustomerId,
  filterSalesByDate,
  convertSaleToEstimate,
  deleteSaleById
};
