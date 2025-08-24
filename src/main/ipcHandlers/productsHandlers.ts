import { and, eq, like, ne, SQL, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload, ProductsType } from "../../shared/types";
import { formatToPaisa } from "../../shared/utils";
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
            price: formatToPaisa(payload.price)
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
        if (query === "") return { status: "success", data: [] };
        console.log(page, limit);
        const offset = (page - 1) * limit;

        const priorityOrder = sql` CASE WHEN ${products.name} LIKE ${query + "%"} THEN 1
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
            price: products.price
          })
          .from(products)
          .where(and(like(products.name, `%${query}%`), ne(products.isDeleted, true)))
          .orderBy(priorityOrder, products.name)
          .limit(limit)
          .offset(offset);

        return { status: "success", data: searchResult };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not search Products" } };
      }
    }
  );
}
