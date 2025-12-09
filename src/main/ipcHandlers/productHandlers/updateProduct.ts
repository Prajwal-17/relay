import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, ProductHistory, ProductPayload } from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { productHistory, products } from "../../db/schema";

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

        // disabled state
        const isDisabledProvided = Object.keys(payload).includes("isDisabled");

        if (isDisabledProvided && existingProduct.isDisabled !== payload.isDisabled) {
          const disabledAt = payload.isDisabled
            ? sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            : null;
          updatedFields["disabledAt"] = disabledAt;
        }

        const updatedProduct = db
          .update(products)
          .set({
            ...updatedFields
          })
          .where(eq(products.id, productId))
          .returning()
          .get();

        if (!updatedProduct) {
          throw new Error("Failed to updated product.");
        }

        function cap(s: string) {
          return s.charAt(0).toUpperCase() + s.slice(1);
        }

        const changedFields: Partial<ProductHistory> = {};

        currencyFields.forEach((field) => {
          const oldValue = existingProduct[field];
          const newValue = updatedProduct[field];

          if (oldValue !== newValue) {
            changedFields[`old${cap(field)}`] = oldValue;

            changedFields[`new${cap(field)}`] = newValue;
          }
        });

        if (Object.keys(changedFields).length > 0) {
          db.insert(productHistory)
            .values({
              name: updatedProduct.name,
              weight: updatedProduct.weight,
              unit: updatedProduct.unit,
              productId: updatedProduct.id,
              oldPrice: changedFields.oldPrice ?? null,
              newPrice: changedFields.newPrice ?? null,
              oldMrp: changedFields.oldMrp ?? null,
              newMrp: changedFields.newMrp ?? null,
              oldPurchasePrice: changedFields.oldPurchasePrice ?? null,
              newPurchasePrice: changedFields.newPurchasePrice ?? null
            })
            .run();
        }

        return {
          status: "success",
          data: `Successfully updated product: ${updatedProduct?.name}`
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not update Product" } };
      }
    }
  );
}
