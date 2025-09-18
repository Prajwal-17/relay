import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { AllTransactionsType, ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { estimates, sales } from "../../db/schema";

export function getAllTransactionsById() {
  // get transaction wrt to customer id
  ipcMain.handle(
    "customersApi:getAllTransactionsById",
    async (_event, customerId): Promise<ApiResponse<AllTransactionsType>> => {
      try {
        const allSales = await db.select().from(sales).where(eq(sales.customerId, customerId));
        const allEstimates = await db
          .select()
          .from(estimates)
          .where(eq(estimates.customerId, customerId));

        return { status: "success", data: [...allSales, ...allEstimates] };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: "Something went wrong" }
        };
      }
    }
  );
}
