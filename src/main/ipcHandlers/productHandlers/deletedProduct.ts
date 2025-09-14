import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function deleteProduct() {
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
}
