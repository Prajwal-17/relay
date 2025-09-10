import { and, eq, like, ne, SQL, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload, ProductsType } from "../../shared/types";
import { formatToPaisa, formatToRupees } from "../../shared/utils/utils";
import { db } from "../db/db";
import { products } from "../db/schema";

export function productHandlers() {
  ipcMain.handle("productsApi:getAllProducts", async (): Promise<ApiResponse<ProductsType[]>> => {
    try {
      const allProducts = await db.select().from(products);
      return { status: "success", data: allProducts };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Could not fetch Products" } };
    }
  });

  // add New product
  ipcMain.handle(
    "productsApi:addNewProduct",
    async (_event, payload: ProductsType): Promise<ApiResponse<string>> => {
      try {
        const result = db
          .insert(products)
          .values({
            name: payload.name,
            weight: payload.weight,
            unit: payload.unit,
            mrp: payload.mrp ? formatToPaisa(payload.mrp) : null,
            price: formatToPaisa(payload.price),
            purchasePrice: payload.purchasePrice ? formatToPaisa(payload.purchasePrice) : null
          })
          .run();

        if (result.changes > 0) {
          return { status: "success", data: "Successfully created new product" };
        } else {
          return {
            status: "error",
            error: { message: "No product was added. Database changes were 0." }
          };
        }
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not add a new Product" } };
      }
    }
  );

  // update product
  ipcMain.handle(
    "productsApi:updateProduct",
    async (_event, payload: ProductPayload, productId: string): Promise<ApiResponse<string>> => {
      try {
        const product = db.select().from(products).where(eq(products.id, productId)).get();

        let disabledAt: SQL | null = null;

        if (product?.isDisabled !== payload.isDisabled) {
          disabledAt = payload.isDisabled ? sql`(datetime('now'))` : null;
        }

        // eslint-disable-next-line
        const { id, createdAt, updatedAt, ...updatePayload } = payload as any;

        const updatedObj = db
          .update(products)
          .set({
            ...updatePayload,
            mrp: updatePayload.mrp ? formatToPaisa(updatePayload.mrp) : null,
            price: formatToPaisa(updatePayload.price),
            purchasePrice: updatePayload.purchasePrice
              ? formatToPaisa(updatePayload.purchasePrice)
              : null,
            disabledAt,
            updatedAt: sql`(datetime('now'))`
          })
          .where(eq(products.id, productId))
          .run();

        if (updatedObj.changes > 0) {
          return { status: "success", data: "Successfully updated product" };
        } else {
          return {
            status: "error",
            error: { message: "No product was updated. Database changes were 0." }
          };
        }
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not update Product" } };
      }
    }
  );

  // delete product
  // add a deleted flag
  ipcMain.handle(
    "productsApi:deleteProduct",
    async (_event, productId: string): Promise<ApiResponse<string>> => {
      try {
        const deletedAt = sql`datetime('now')`;

        const updatedObj = db
          .update(products)
          .set({
            isDeleted: true,
            deletedAt,
            updatedAt: sql`(datetime('now'))`
          })
          .where(eq(products.id, productId))
          .run();

        if (updatedObj.changes > 0) {
          return { status: "success", data: "Successfully deleted product" };
        } else {
          return {
            status: "error",
            error: { message: "No product was deleted. Database changes were 0." }
          };
        }
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not delete Product" } };
      }
    }
  );

  ipcMain.handle(
    "productsApi:search",
    async (
      _event,
      query: string,
      page: number,
      limit: number
    ): Promise<ApiResponse<ProductsType[]>> => {
      try {
        const cleanedQuery = query
          .replace(/\d+\s*(rs?|₹)/gi, "")
          .replace(/\d+\s*(g|kg|ml|l|pc|none)/gi, "")
          .replace(/\b(g|kg|ml|l|pc|none)\b/gi, "")
          .trim();

        const searchTerms = cleanedQuery
          .trim()
          .toLowerCase()
          .split(" ")
          .filter((term) => term.length > 0);

        if (searchTerms.length === 0) {
          return { status: "success", data: [] };
        }

        const offset = (page - 1) * limit;

        const combinedSearchField = sql<string>`lower(${products.name} || ' ' || COALESCE(${products.weight}, '') || ' ' || COALESCE(${products.unit}, '') || ' ' || COALESCE(${products.mrp}, '') || ' ' || ${products.price})`;

        const searchConditions = searchTerms.map((term) => like(combinedSearchField, `%${term}%`));

        const priorityOrder = sql`
        CASE
          WHEN lower(${products.name}) LIKE ${searchTerms[0] + "%"} THEN 1
          ELSE 2
        END
      `;

        const searchResult = await db
          .select({
            id: products.id,
            name: products.name,
            weight: products.weight,
            unit: products.unit,
            mrp: products.mrp,
            price: products.price,
            purchasePrice: products.purchasePrice
          })
          .from(products)
          .where(and(ne(products.isDeleted, true), ...searchConditions))
          .orderBy(priorityOrder, products.name)
          .limit(limit)
          .offset(offset);

        return {
          status: "success",
          data: searchResult.map((product) => ({
            ...product,
            mrp: product.mrp && formatToRupees(product.mrp),
            price: formatToRupees(product.price),
            purchasePrice: product.purchasePrice && formatToRupees(product.purchasePrice)
          }))
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not search Products" } };
      }
    }
  );
}
