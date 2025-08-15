import { ipcMain } from "electron/main";
import type { ApiResponse, ProductsType } from "../../shared/types";
import { products } from "../db/schema";
import { db } from "../db/db";
import { like, sql } from "drizzle-orm";

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
