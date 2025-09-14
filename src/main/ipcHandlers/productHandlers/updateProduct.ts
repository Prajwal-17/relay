import { eq, SQL, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload } from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function updateProduct() {
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
            purchasePrice: updatePayload.purchasePrice
              ? formatToPaisa(updatePayload.purchasePrice)
              : null,
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
}
