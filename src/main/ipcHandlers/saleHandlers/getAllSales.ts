import { desc } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, Sale } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { sales } from "../../db/schema";

export function getAllSales() {
  // get all sales
  ipcMain.handle("salesApi:getAllSales", async (): Promise<ApiResponse<Sale[]>> => {
    try {
      const salesArray = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(40);

      return {
        status: "success",
        data: salesArray.map((sale: Sale) => {
          return {
            ...sale,
            grandTotal: sale.grandTotal && formatToRupees(sale.grandTotal)
          };
        })
      };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve sales" } };
    }
  });
}
