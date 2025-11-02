import { desc } from "drizzle-orm";
import { ipcMain } from "electron";
import type { ApiResponse, TopProductDataPoint } from "../../../shared/types";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function getTopProducts() {
  ipcMain.handle(
    "dashboardApi:getTopProducts",
    async (): Promise<ApiResponse<TopProductDataPoint[]>> => {
      try {
        const result = db
          .select({
            id: products.id,
            name: products.name,
            totalQuantitySold: products.totalQuantitySold
          })
          .from(products)
          .orderBy(desc(products.totalQuantitySold))
          .limit(5)
          .all();

        const sum = result.reduce((acc, curr) => {
          if (!curr.totalQuantitySold) return acc;
          return curr.totalQuantitySold + acc;
        }, 0);

        return {
          status: "success",
          data: result.map((r) => ({
            id: r.id,
            name: r.name,
            totalQuantitySold: r.totalQuantitySold ? r.totalQuantitySold : 0,
            sharePercent: r.totalQuantitySold
              ? Number(((r.totalQuantitySold / sum) * 100).toFixed(2))
              : 0
          }))
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "Could not fetch top products."
          }
        };
      }
    }
  );
}
