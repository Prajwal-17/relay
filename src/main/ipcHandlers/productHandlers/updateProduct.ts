import { eq, SQL, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload } from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { productHistory, products } from "../../db/schema";

export function updateProduct() {
  // update product
  ipcMain.handle(
    "productsApi:updateProduct",
    async (_event, payload: ProductPayload, productId: string): Promise<ApiResponse<string>> => {
      try {
        const product = db.select().from(products).where(eq(products.id, productId)).get();

        let disabledAt: SQL | null = null;

        if (product?.isDisabled !== payload.isDisabled) {
          disabledAt = payload.isDisabled ? sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))` : null;
        }

        // eslint-disable-next-line
        const { id, createdAt, updatedAt, ...updatePayload } = payload as any;

        const result = db.transaction((tx) => {
          const originalProduct = tx
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .get();

          if (!originalProduct) {
            throw new Error("Product does not exist");
          }

          const updatedProduct = tx
            .update(products)
            .set({
              ...updatePayload,
              mrp: updatePayload.mrp ? formatToPaisa(updatePayload.mrp) : null,
              price: formatToPaisa(updatePayload.price),
              purchasePrice: updatePayload.purchasePrice
                ? formatToPaisa(updatePayload.purchasePrice)
                : null,
              disabledAt,
              updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            })
            .where(eq(products.id, productId))
            .returning({
              id: products.id,
              name: products.name,
              weight: products.weight,
              unit: products.unit,
              price: products.price,
              mrp: products.mrp,
              purchasePrice: products.purchasePrice
            })
            .get();

          if (!updatedProduct) {
            throw new Error("Failed to get ID for the new product.");
          }

          // version history
          tx.insert(productHistory)
            .values({
              name: updatedProduct.name,
              weight: updatedProduct.weight,
              unit: updatedProduct.unit,
              productId: updatedProduct.id,
              oldPrice: originalProduct.price,
              newPrice: updatedProduct.price,
              oldMrp: originalProduct.mrp,
              newMrp: updatedProduct.mrp ? updatedProduct.mrp : null,
              oldPurchasePrice: originalProduct.purchasePrice,
              newPurchasePrice: updatedProduct.purchasePrice ? updatedProduct.purchasePrice : null
            })
            .run();

          return updatedProduct;
        });

        if (result.id) {
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
