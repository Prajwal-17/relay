import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload } from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function updateProduct() {
  // update product
  ipcMain.handle(
    "productsApi:updateProduct",
    async (
      _event,
      productId: string,
      payload: Partial<ProductPayload>
    ): Promise<ApiResponse<string>> => {
      try {
        const currencyFields = ["price", "purchasePrice", "mrp"] as const;

        if (!productId) {
          return {
            status: "error",
            error: {
              message: "The productsId cannot be empty."
            }
          };
        }

        if (Object.keys(products).length === 0) {
          return {
            status: "error",
            error: {
              message: "The 'products' object cannot be empty. Please provide at least one product."
            }
          };
        }

        const existingProduct = db.select().from(products).where(eq(products.id, productId)).get();

        if (!existingProduct) {
          return {
            status: "error",
            error: {
              message: "Product does not exist"
            }
          };
        }

        const updatedFields = {};

        for (const field in payload) {
          const value = payload[field];
          if (value === undefined) {
            continue;
          }

          if (currencyFields.includes(field as any)) {
            if (value === null) {
              updatedFields[field] = null;
            } else {
              updatedFields[field] = formatToPaisa(value);
            }
          } else {
            updatedFields[field] = value;
          }
        }

        const isDisabledProvided = Object.keys(payload).includes("isDisabled");

        if (isDisabledProvided && existingProduct.isDisabled !== payload.isDisabled) {
          const disabledAt = payload.isDisabled
            ? sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : null;
          updatedFields["disabledAt"] = disabledAt;
        }

        const result = db
          .update(products)
          .set({
            ...updatedFields
          })
          .where(eq(products.id, productId))
          .returning()
          .get();

        if (!result) {
          throw new Error("Failed to updated product.");
        }

        return {
          status: "success",
          data: `Successfully updated product: ${result?.name}`
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not update Product" } };
      }
    }
  );
}
