import { ipcMain } from "electron/main";
import type { ApiResponse, ProductPayload } from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { productHistory, products } from "../../db/schema";

export function addNewProduct() {
  // add New product
  ipcMain.handle(
    "productsApi:addNewProduct",
    async (_event, payload: ProductPayload): Promise<ApiResponse<string>> => {
      try {
        const result = db.transaction((tx) => {
          const product = tx
            .insert(products)
            .values({
              name: payload.name,
              weight: payload.weight,
              unit: payload.unit,
              mrp: payload.mrp ? formatToPaisa(payload.mrp) : null,
              price: formatToPaisa(payload.price),
              purchasePrice: payload.purchasePrice ? formatToPaisa(payload.purchasePrice) : null
            })
            .returning()
            .get();

          if (!product) throw new Error("Could not create new product");

          // init entry in productHistory table
          const history = tx
            .insert(productHistory)
            .values({
              name: product.name,
              weight: product.weight,
              unit: product.unit,
              productId: product.id,
              oldPrice: null,
              newPrice: product.price,
              oldMrp: null,
              newMrp: product.mrp ? product.mrp : null,
              oldPurchasePrice: null,
              newPurchasePrice: product.purchasePrice ? product.purchasePrice : null
            })
            .returning()
            .get();

          return { product, history };
        });

        return {
          status: "success",
          data: `Successfully created product: ${result.product.name}`
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not add a new Product" } };
      }
    }
  );
}
