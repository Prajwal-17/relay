import { and, like, ne, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductsType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function searchProduct() {
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
