import { eq } from "drizzle-orm";
import { ipcMain } from "electron";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { sales } from "../../db/schema";

export function deleteSale() {
  // delete a sale
  ipcMain.handle("salesApi:deleteSale", async (_event, saleId): Promise<ApiResponse<string>> => {
    try {
      if (!saleId) {
        return {
          status: "error",
          error: {
            message: "Sales does not exist"
          }
        };
      }

      const result = await db.delete(sales).where(eq(sales.id, saleId));

      if (result.changes > 0) {
        return { status: "success", data: "Sale deleted successfull" };
      }

      return {
        status: "error",
        error: {
          message: "Sale not found.Could be already deleted"
        }
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        error: {
          message: "Something went wrong in sales api"
        }
      };
    }
  });
}
