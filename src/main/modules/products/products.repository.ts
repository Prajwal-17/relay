import { and, eq, like, sql } from "drizzle-orm";
import type { CreateProductPayload, Product } from "../../../shared/types";
import { formatToPaisa, formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, productHistory, products, saleItems } from "../../db/schema";
import { generateProductSnapshot } from "../../utils/product.utils";
import type { ProductSearchQuery } from "./products.types";

const findById = async (id: string) => {
  return db.select().from(products).where(eq(products.id, id)).get();
};

const searchProducts = async (params: ProductSearchQuery) => {
  let searchResult: Product[] | [];

  if (params.searchTerms.length === 0) {
    searchResult = await db
      .select({
        id: products.id,
        name: products.name,
        productSnapshot: products.productSnapshot,
        weight: products.weight,
        unit: products.unit,
        mrp: products.mrp,
        price: products.price,
        purchasePrice: products.purchasePrice,
        totalQuantitySold: products.totalQuantitySold,
        isDisabled: products.isDisabled
      })
      .from(products)
      .where(params.whereClause)
      .orderBy(products.name)
      .limit(params.limit)
      .offset(params.offset);
  }
  const combinedSearchField = sql<string>`lower(${products.name} || ' ' || COALESCE(${products.weight}, '') || ' ' || COALESCE(${products.unit}, '') || ' ' || COALESCE(${products.mrp}, '') || ' ' || ${products.price})`;

  const searchConditions = params.searchTerms.map((term) => like(combinedSearchField, `%${term}%`));

  const priorityOrder = sql`
          CASE
            WHEN lower(${products.name}) LIKE ${params.searchTerms[0] + "%"} THEN 1
            ELSE 2
          END
        `;

  searchResult = await db
    .select({
      id: products.id,
      name: products.name,
      productSnapshot: products.productSnapshot,
      weight: products.weight,
      unit: products.unit,
      mrp: products.mrp,
      price: products.price,
      purchasePrice: products.purchasePrice,
      totalQuantitySold: products.totalQuantitySold,
      isDisabled: products.isDisabled
    })
    .from(products)
    .where(and(params.whereClause, ...searchConditions))
    .orderBy(priorityOrder, products.name)
    .limit(params.limit)
    .offset(params.offset);

  return searchResult;
};

const createProduct = async (payload: CreateProductPayload) => {
  return db.transaction((tx) => {
    const product = tx
      .insert(products)
      .values({
        name: payload.name,
        productSnapshot: generateProductSnapshot({
          name: payload.name,
          weight: payload.weight ?? null,
          unit: payload.unit ?? null,
          mrp: payload.mrp ? formatToRupees(payload.mrp) : null
        }),
        weight: payload.weight ?? null,
        unit: payload.unit ?? null,
        mrp: payload.mrp != null ? formatToPaisa(payload.mrp) : null,
        price: formatToPaisa(payload.price),
        purchasePrice: payload.purchasePrice != null ? formatToPaisa(payload.purchasePrice) : null
      })
      .returning()
      .get();

    if (!product) throw new Error("Could not create new product");

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

const updateById = async (productId: string, updatedFields: Partial<Product>) => {
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

const deleteProductById = async (productId: string) => {
  const deletedAt = sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

  const inSales = await db.query.saleItems.findFirst({ where: eq(saleItems.productId, productId) });
  const inEstimates = await db.query.estimateItems.findFirst({
    where: eq(estimateItems.productId, productId)
  });
  if (inSales || inEstimates) throw new Error("IN_USE");

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

export const productRepository = {
  findById,
  searchProducts,
  createProduct,
  updateById,
  insertHistory,
  deleteProductById
};
