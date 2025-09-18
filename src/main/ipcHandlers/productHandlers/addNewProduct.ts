import { ipcMain } from "electron/main";
import type { ApiResponse, ProductsType } from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function addNewProduct() {
  // add New product
  ipcMain.handle(
    "productsApi:addNewProduct",
    async (_event, payload: ProductsType): Promise<ApiResponse<string>> => {
      try {
        const result = db
          .insert(products)
          .values({
            name: payload.name,
            weight: payload.weight,
            unit: payload.unit,
            mrp: payload.mrp ? formatToPaisa(payload.mrp) : null,
            price: formatToPaisa(payload.price),
            purchasePrice: payload.purchasePrice ? formatToPaisa(payload.purchasePrice) : null
          })
          .run();

        if (result.changes > 0) {
          return { status: "success", data: "Successfully created new product" };
        } else {
          return {
            status: "error",
            error: { message: "No product was added. Database changes were 0." }
          };
        }
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not add a new Product" } };
      }
    }
  );
}
