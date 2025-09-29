import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { estimateItems, products, saleItems } from "../../db/schema";

export function deleteProduct() {
  // delete product
  // add a deleted flag
  ipcMain.handle(
    "productsApi:deleteProduct",
    async (_event, productId: string): Promise<ApiResponse<string>> => {
      try {
        const deletedAt = sql`datetime('now')`;

        const existingInSales = await db.query.saleItems.findFirst({
          where: eq(saleItems.productId, productId)
        });

        const existingInEstimates = await db.query.estimateItems.findFirst({
          where: eq(estimateItems.productId, productId)
        });

        if (existingInSales || existingInEstimates) {
          return {
            status: "error",
            error: {
              message: "Cannot delete product. It is already used in existing sales or estimates."
            }
          };
        }

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
        return {
          status: "error",
          error: { message: (error as any).message ?? "Could not delete Product" }
        };
      }
    }
  );
}
