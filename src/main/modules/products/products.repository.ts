import { and, eq, like, sql } from "drizzle-orm";
import type {
  CreateProductPayload,
  ProductWithDeletion,
  UpdateProductPayload
} from "../../../shared/types";
import { convertToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, productHistory, products, saleItems } from "../../db/schema";
import { generateProductSnapshot } from "../../utils/product.utils";
import type { ProductSearchQuery } from "./products.types";

const findById = async (id: string) => {
  return db.select().from(products).where(eq(products.id, id)).get();
};

const searchProducts = async (params: ProductSearchQuery) => {
  let searchResult: ProductWithDeletion[] | [];

  if (params.searchTerm === "") {
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
        isDisabled: products.isDisabled,
        isDeleted: products.isDeleted,
        deletedAt: products.deletedAt
      })
      .from(products)
      .where(params.whereClause)
      .orderBy(products.name)
      .limit(params.limit)
      .offset(params.offset);
  }

  const priorityOrder = sql`
          CASE
            WHEN lower(${products.name}) LIKE ${params.searchTerm + "%"} THEN 1
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
      isDisabled: products.isDisabled,
      isDeleted: products.isDeleted,
      deletedAt: products.deletedAt
    })
    .from(products)
    .where(and(params.whereClause, like(products.productSnapshot, `%${params.searchTerm}%`)))
    .orderBy(priorityOrder, products.productSnapshot)
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
          mrp: payload.mrp ? payload.mrp : null
        }),
        weight: payload.weight ?? null,
        unit: payload.unit ?? null,
        mrp: payload.mrp != null ? convertToPaisa(payload.mrp) : null,
        price: convertToPaisa(payload.price),
        purchasePrice: payload.purchasePrice != null ? convertToPaisa(payload.purchasePrice) : null
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
