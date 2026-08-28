import { and, count, desc, eq, inArray, like, sql, type SQL } from "drizzle-orm";
import { type CreateProductPayload, type UpdateProductPayload } from "../../../shared/types";
import { generateProductSnapshot } from "../../../shared/utils/productSnapshot";
import { paisaToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import {
  customers,
  estimateItems,
  estimates,
  productHistory,
  products,
  saleItems,
  sales
} from "../../db/schema";
import { AppError } from "../../utils/appError";
import type { ProductSearchQuery } from "./products.types";

const findById = async (id: string) => {
  return db.select().from(products).where(eq(products.id, id)).get();
};

const columns = {
  id: products.id,
  name: products.name,
  imageUrl: products.imageUrl,
  productSnapshot: products.productSnapshot,
  weight: products.weight,
  unit: products.unit,
  mrp: products.mrp,
  price: products.price,
  purchasePrice: products.purchasePrice,
  totalQuantitySold: products.totalQuantitySold,
  isDisabled: products.isDisabled,
  disabledAt: products.disabledAt,
  isDeleted: products.isDeleted,
  deletedAt: products.deletedAt,
  lastSoldAt: products.lastSoldAt,
  updatedAt: products.updatedAt,
  createdAt: products.createdAt
};

const billingColumns = {
  id: products.id,
  name: products.name,
  imageUrl: products.imageUrl,
  productSnapshot: products.productSnapshot,
  weight: products.weight,
  unit: products.unit,
  mrp: products.mrp,
  price: products.price,
  purchasePrice: products.purchasePrice,
  updatedAt: products.updatedAt,
  createdAt: products.createdAt
};

const searchProducts = async (params: ProductSearchQuery) => {
  const selectedColumns = params.billingMode ? billingColumns : columns;

  if (params.searchTerm === "") {
    return db
      .select(selectedColumns)
      .from(products)
      .where(params.whereClause)
      .orderBy(params.orderClause ?? products.name)
      .limit(params.limit)
      .offset(params.offset);
  }

  const term = params.searchTerm;

  const relevance = sql`
    CASE
      WHEN lower(${products.productSnapshot}) LIKE ${term + "%"} THEN 1
      WHEN lower(${products.productSnapshot}) LIKE ${"%" + term + "%"} THEN 2
      ELSE 3
    END
  `;

  const orderBy = params.orderClause ? [relevance, params.orderClause] : [relevance, products.name];

  return db
    .select(selectedColumns)
    .from(products)
    .where(and(params.whereClause, like(products.productSnapshot, `%${term}%`)))
    .orderBy(...orderBy)
    .limit(params.limit)
    .offset(params.offset);
};

const countSearchProducts = async (params: {
  searchTerm: string;
  whereClause: SQL | undefined;
}) => {
  if (params.searchTerm === "") {
    const result = db.select({ count: count() }).from(products).where(params.whereClause).get();
    return result?.count ?? 0;
  }

  const term = params.searchTerm;

  const result = db
    .select({ count: count() })
    .from(products)
    .where(and(params.whereClause, like(products.productSnapshot, `%${term}%`)))
    .get();
  return result?.count ?? 0;
};

const createProduct = async (payload: CreateProductPayload) => {
  const normalizedUnit = payload.unit === "none" ? null : payload.unit;

  return db.transaction((tx) => {
    const product = tx
      .insert(products)
      .values({
        name: payload.name,
        imageUrl: payload.imageUrl,
        productSnapshot: generateProductSnapshot({
          name: payload.name,
          weight: payload.weight ?? null,
          unit: normalizedUnit ?? null,
          mrp: payload.mrp ? paisaToRupees(payload.mrp) : null
        }),
        weight: payload.weight ?? null,
        unit: normalizedUnit ?? null,
        mrp: payload.mrp ?? null,
        price: payload.price,
        purchasePrice: payload.purchasePrice ?? null
      })
      .returning()
      .get();

    if (!product) throw new AppError("Could not create new product", 500);

    tx.insert(productHistory)
      .values({
        name: product.name,
        weight: product.weight,
        unit: product.unit,
        productId: product.id,
        oldPrice: null,
        newPrice: product.price,
        oldMrp: null,
        newMrp: product.mrp ?? null,
        oldPurchasePrice: null,
        newPurchasePrice: product.purchasePrice ?? null
      })
      .returning()
      .get();

    return product;
  });
};

const updateById = async (
  productId: string,
  updatedFields: Partial<UpdateProductPayload & { productSnapshot: string }>
) => {
  return db
    .update(products)
    .set({
      ...updatedFields
    })
    .where(eq(products.id, productId))
    .returning()
    .get();
};

const insertHistory = async (historyObj: any) => {
  return db.insert(productHistory).values(historyObj).run();
};

const getHistoryEntriesById = async (productId: string) => {
  return db
    .select({
      oldPrice: productHistory.oldPrice,
      newPrice: productHistory.newPrice,
      oldMrp: productHistory.oldMrp,
      newMrp: productHistory.newMrp,
      oldPurchasePrice: productHistory.oldPurchasePrice,
      newPurchasePrice: productHistory.newPurchasePrice,
      createdAt: productHistory.createdAt
    })
    .from(productHistory)
    .where(eq(productHistory.productId, productId))
    .orderBy(desc(productHistory.createdAt))
    .all();
};

const softDeleteProductById = async (productId: string) => {
  const deletedAt = sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

  const result = db
    .update(products)
    .set({
      isDeleted: true,
      deletedAt,
      updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .where(eq(products.id, productId))
    .run();

  return result.changes;
};

const hardDeleteProductById = async (productId: string) => {
  return db.transaction((tx) => {
    const salesResult = tx
      .select({ count: count() })
      .from(sales)
      .where(
        inArray(
          sales.id,
          tx
            .select({ saleId: saleItems.saleId })
            .from(saleItems)
            .where(eq(saleItems.productId, productId))
        )
      )
      .get();

    const estimatesResult = tx
      .select({ count: count() })
      .from(estimates)
      .where(
        inArray(
          estimates.id,
          tx
            .select({ estimateId: estimateItems.estimateId })
            .from(estimateItems)
            .where(eq(estimateItems.productId, productId))
        )
      )
      .get();

    const linkedSalesCount = salesResult?.count ?? 0;
    const linkedEstimatesCount = estimatesResult?.count ?? 0;

    if (linkedSalesCount > 0 || linkedEstimatesCount > 0) {
      const parts: any = [];
      if (linkedSalesCount > 0) parts.push(`${linkedSalesCount} sale(s)`);
      if (linkedEstimatesCount > 0) parts.push(`${linkedEstimatesCount} estimate(s)`);

      const errorMessage = `Cannot delete product. It is currently linked to ${parts.join(" and ")}.`;

      throw new AppError(errorMessage, 400);
    }

    const result = db.delete(products).where(eq(products.id, productId)).run();

    return result.changes;
  });
};

const restoreSoftDeletedProductById = async (productId: string) => {
  const result = db
    .update(products)
    .set({
      isDeleted: false,
      deletedAt: null,
      updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .where(eq(products.id, productId))
    .run();

  return result.changes;
};

const getTransactionsByProductId = async (params: {
  productId: string;
  pageSize: number;
  offset: number;
}) => {
  const saleRows = db
    .select({
      id: sales.id,
      type: sql<string>`'sale'`.as("type"),
      transactionNo: sales.invoiceNo,
      customerName: customers.name,
      quantity: saleItems.quantity,
      price: saleItems.price,
      totalPrice: saleItems.totalPrice,
      createdAt: sales.createdAt
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(customers, eq(sales.customerId, customers.id))
    .where(eq(saleItems.productId, params.productId))
    .all();

  const estimateRows = db
    .select({
      id: estimates.id,
      type: sql<string>`'estimate'`.as("type"),
      transactionNo: estimates.estimateNo,
      customerName: customers.name,
      quantity: estimateItems.quantity,
      price: estimateItems.price,
      totalPrice: estimateItems.totalPrice,
      createdAt: estimates.createdAt
    })
    .from(estimateItems)
    .innerJoin(estimates, eq(estimateItems.estimateId, estimates.id))
    .innerJoin(customers, eq(estimates.customerId, customers.id))
    .where(eq(estimateItems.productId, params.productId))
    .all();

  const combined = [...saleRows, ...estimateRows].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return combined.slice(params.offset, params.offset + params.pageSize);
};

const countTransactionsByProductId = async (productId: string) => {
  const salesCount = db
    .select({ count: count() })
    .from(saleItems)
    .where(eq(saleItems.productId, productId))
    .get();

  const estimatesCount = db
    .select({ count: count() })
    .from(estimateItems)
    .where(eq(estimateItems.productId, productId))
    .get();

  return (salesCount?.count ?? 0) + (estimatesCount?.count ?? 0);
};

export const productRepository = {
  findById,
  searchProducts,
  countSearchProducts,
  createProduct,
  updateById,
  insertHistory,
  getHistoryEntriesById,
  softDeleteProductById,
  hardDeleteProductById,
  restoreSoftDeletedProductById,
  getTransactionsByProductId,
  countTransactionsByProductId
};
