import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload, ProductsType } from "../../shared/types";
import { products } from "../db/schema";
import { db } from "../db/db";
import { eq, like, sql } from "drizzle-orm";
import { PgRelationalQuery } from "drizzle-orm/pg-core/query-builders/query";

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
            mrp: payload.mrp,
            price: payload.price
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

  ipcMain.handle(
    "productsApi:updateProduct",
    async (_event, payload: ProductPayload, productId: string): Promise<ApiResponse<string>> => {
      try {
        const product = db.select().from(products).where(eq(products.id, productId)).get();

        let disabledAt: Date | null = null;

        if (product?.isDisabled !== payload.isDisabled) {
          disabledAt = payload.isDisabled ? new Date() : null;
        }

        // eslint-disable-next-line
        const { id, createdAt, updatedAt, ...updatePayload } = payload as any;

        const updatedObj = db
          .update(products)
          .set({
            ...updatePayload,
            disabledAt,
            updatedAt: new Date()
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

        const priorityOrder = sql`
            CASE
                WHEN ${products.name} LIKE ${query + "%"} THEN 1
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
          .where(like(products.name, `%${query}%`))
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
